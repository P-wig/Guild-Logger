from markupsafe import escape #protects projects against injection attacks
import os
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template, session, jsonify, current_app, request
import pymysql

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
        users_list = cursor.fetchall()
        cursor.close()
        return jsonify(users_list)

    return admin_blueprint