from markupsafe import escape #protects projects against injection attacks
import os
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template, session, jsonify, current_app, request
import pymysql
from datetime import datetime

def get_blueprint():
    admin_blueprint = Blueprint('admin', __name__, url_prefix='/admin')

    @admin_blueprint.route('/')
    def render_admin_page():
        # Check if the user is logged in and has permission to access the admin page
        allowed_users = [uid.strip() for uid in os.getenv('ALLOWED_USERS', '').split(',')]
        if not session.get('user') or session['user']['id'] not in allowed_users:
            return render_template('access_denied.html'), 403
        
        return render_template('admin.html')

    @admin_blueprint.route('/api/users')
    def api_users():
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        # Get pagination params from query string, with defaults
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        cursor.execute('SELECT * FROM users LIMIT %s OFFSET %s', (per_page, offset)) # needs to update when implementing multi server support
        users = cursor.fetchall()
        for user in users:
            user['user_id'] = str(user['user_id'])
            user['guild_id'] = str(user['guild_id'])
        return jsonify(users)

    @admin_blueprint.route('/api/events')
    def api_events():
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        cursor.execute('SELECT * FROM events LIMIT %s OFFSET %s', (per_page, offset))
        events_list = cursor.fetchall()
        cursor.close()
        return jsonify(events_list)

    @admin_blueprint.route('/api/events/<int:event_id>/attendees')
    def api_event_attendees(event_id):
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        cursor.execute('''
            SELECT u.user_id
            FROM event_attendees ea
            JOIN users u ON ea.user_id = u.user_id
            WHERE ea.event_id = %s
        ''', (event_id,))
        attendees = cursor.fetchall()
        cursor.close()
        return jsonify(attendees)

    @admin_blueprint.route('/api/former_users')
    def api_former_users():
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        cursor.execute('SELECT * FROM former_users LIMIT %s OFFSET %s', (per_page, offset))
        former_users_list = cursor.fetchall()
        cursor.close()
        return jsonify(former_users_list)

    @admin_blueprint.route('/api/users/<int:user_id>', methods=['PUT'])
    def update_user(user_id):
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        if data['status'] not in ('active', 'retired'):
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        try:
            datetime.strptime(data['join_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        cursor.execute(
            "UPDATE users SET join_date=%s, status=%s WHERE user_id=%s",
            (data['join_date'], data['status'], user_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    @admin_blueprint.route('/api/users/<int:user_id>', methods=['DELETE'])
    def delete_user(user_id):
        db = current_app.get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM users WHERE user_id=%s", (user_id,))
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    return admin_blueprint