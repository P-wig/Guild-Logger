from markupsafe import escape #protects projects against injection attacks
import os
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template, session, jsonify, current_app, request
import pymysql
import requests
from datetime import datetime
import asyncio
from bot.bot import bot, bot_ready  # Import your bot instance

token = os.getenv("DISCORD_TOKEN")

def get_blueprint():
    admin_blueprint = Blueprint('admin', __name__, url_prefix='/admin')

    @admin_blueprint.route('/')
    def render_admin_page():
        # Check if the user is logged in and has permission to access the admin page
        allowed_users = [uid.strip() for uid in os.getenv('ALLOWED_USERS', '').split(',')]
        if not session.get('user') or session['user']['id'] not in allowed_users:
            return render_template('access_denied.html'), 403
        
        return render_template('admin.html')

    @admin_blueprint.route('/api/guilds')
    def api_guilds():
        discord_token = session.get('discord_token') # <-- initiallized in auth_route.py/callback
        if not discord_token:
            return jsonify([])

        headers = {'Authorization': f'Bearer {discord_token}'}
        resp = requests.get('https://discord.com/api/users/@me/guilds', headers=headers)
        guilds = resp.json()
        admin_guilds = [g for g in guilds if (g['owner'] or (int(g['permissions']) & 0x20))]
        return jsonify([
            {'id': g['id'], 'name': g['name'], 'icon': g.get('icon')}
            for g in admin_guilds
        ])

    # User API routes
    @admin_blueprint.route('/api/users')
    def api_users():
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        search = request.args.get('search', '').strip()
        guild_id = request.args.get('guild_id', None)

        where_clauses = []
        params = []
        if guild_id:
            where_clauses.append('u.guild_id = %s')
            params.append(guild_id)
        if search:
            where_clauses.append('u.user_id LIKE %s')
            params.append(f'%{search}%')
        where_sql = ' WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''

        query = f"""
            SELECT
                u.*,
                COUNT(DISTINCT e.event_id) AS total_events_hosted,
                COUNT(DISTINCT ea.event_id) AS total_events_attended
            FROM users u
            LEFT JOIN events e ON e.host_id = u.user_id AND e.guild_id = u.guild_id
            LEFT JOIN event_attendees ea ON ea.user_id = u.user_id
            {where_sql}
            GROUP BY u.user_id, u.guild_id
            LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        cursor.execute(query, tuple(params))
        users = cursor.fetchall()

        # Format user fields
        for user in users:
            user['user_id'] = str(user['user_id'])
            user['guild_id'] = str(user['guild_id'])
            user['join_date'] = user['join_date'].strftime('%Y-%m-%d')

        # Get consecutive main events missed for all users on the page
        user_ids = [user['user_id'] for user in users]
        guild_ids = [user['guild_id'] for user in users]
        if users:
            # ---------------------------------------------------------------
            # This query calculates the number of consecutive main events missed
            # for each user on the current page.
            #
            # Steps:
            # 1. For each user, join all events in their guild (no event type filter).
            # 2. Attach RSVP info for each user/event from MainEventRSVP using main_event_id.
            # 3. Only consider users and guilds on the current page (pagination).
            # 4. Only include events that have already occurred (e.date < NOW()).
            # 5. In the subquery, select events where RSVP is still 'pending'
            #    and the event date has already passed (i.e., missed RSVP).
            # 6. Group results by user and guild to get the count of missed events.
            # ---------------------------------------------------------------
            cursor.execute(f"""
                SELECT
                    sub.user_id,
                    sub.guild_id,
                    COUNT(*) AS consecutive_main_events_missed
                FROM (
                    SELECT
                        u.user_id,
                        u.guild_id,
                        e.event_id,
                        e.date,
                        r.rsvp_status
                    FROM users u
                    JOIN events e ON e.guild_id = u.guild_id
                    LEFT JOIN MainEventRSVP r ON r.main_event_id = e.event_id AND r.user_id = u.user_id
                    WHERE u.user_id IN ({','.join(['%s']*len(user_ids))}) AND u.guild_id IN ({','.join(['%s']*len(guild_ids))})
                    AND e.date < NOW()
                    ORDER BY e.date DESC
                ) sub
                WHERE sub.rsvp_status = 'pending' AND sub.date < NOW()
                GROUP BY sub.user_id, sub.guild_id
            """, tuple(user_ids + guild_ids))
            missed_map = {(row['user_id'], row['guild_id']): row['consecutive_main_events_missed'] for row in cursor.fetchall()}
        else:
            missed_map = {}

        for user in users:
            key = (user['user_id'], user['guild_id'])
            user['consecutive_main_events_missed'] = missed_map.get(key, 0)

        return jsonify(users)

    @admin_blueprint.route('/api/users/<user_id>/<guild_id>', methods=['PUT'])
    def update_user(user_id, guild_id):
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
            "UPDATE users SET join_date=%s, status=%s WHERE user_id=%s AND guild_id=%s",
            (data['join_date'], data['status'], user_id, guild_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    @admin_blueprint.route('/api/users/<user_id>/<guild_id>', methods=['DELETE'])
    def delete_user(user_id, guild_id):
        db = current_app.get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM users WHERE user_id=%s AND guild_id=%s", (user_id, guild_id))
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    @admin_blueprint.route('/api/users', methods=['POST'])
    def add_user():
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        # Validate input
        if data['status'] not in ('active', 'retired'):
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        try:
            datetime.strptime(data['join_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        try:
            cursor.execute(
                "INSERT INTO users (user_id, guild_id, join_date, status) VALUES (%s, %s, %s, %s)",
                (str(data['user_id']), str(data['guild_id']), data['join_date'], data['status'])
            )
            db.commit()
        except Exception as e:
            if "Duplicate entry" in str(e):
                return jsonify({'success': False, 'error': 'User ID already exists.'}), 400
            return jsonify({'success': False, 'error': str(e)}), 400
        finally:
            cursor.close()
        return jsonify({'success': True})
    
    # Events API routes
    @admin_blueprint.route('/api/events')
    def api_events():
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        cursor.execute('SELECT * FROM events LIMIT %s OFFSET %s', (per_page, offset))
        events_list = cursor.fetchall()
        for event in events_list:
            event['event_id'] = str(event['event_id'])
            event['host_id'] = str(event['host_id'])
            event['guild_id'] = str(event['guild_id'])
            # Format the date as YYYY-MM-DD
            event['date'] = event['date'].strftime('%Y-%m-%d')
        cursor.close()
        return jsonify(events_list)
    
    # Add an event
    @admin_blueprint.route('/api/events', methods=['POST'])
    def add_event():
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        try:
            datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        try:
            cursor.execute(
                "INSERT INTO events (host_id, date, guild_id) VALUES (%s, %s, %s)",
                (str(data['host_id']), data['date'], str(data['guild_id']))
            )
            db.commit()
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
        finally:
            cursor.close()
        return jsonify({'success': True})
    
    # Update an event
    @admin_blueprint.route('/api/events/<event_id>', methods=['PUT'])
    def update_event(event_id):
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        try:
            datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        cursor.execute(
            "UPDATE events SET host_id=%s, date=%s, guild_id=%s WHERE event_id=%s",
            (str(data['host_id']), data['date'], str(data['guild_id']), event_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'success': True})
    
    # Delete an event
    @admin_blueprint.route('/api/events/<event_id>', methods=['DELETE'])
    def delete_event(event_id):
        db = current_app.get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM events WHERE event_id=%s", (event_id,))
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    # List event attendees
    @admin_blueprint.route('/api/events/<int:event_id>/attendees')
    def api_event_attendees(event_id):
        db = current_app.get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        cursor.execute('''
            SELECT user_id
            FROM event_attendees
            WHERE event_id = %s
        ''', (event_id,))
        attendees = cursor.fetchall()
        for attendee in attendees:
            attendee['user_id'] = str(attendee['user_id'])
        cursor.close()
        return jsonify(attendees)

    # Add an attendee to an event
    @admin_blueprint.route('/api/events/<int:event_id>/attendees', methods=['POST'])
    def add_event_attendee(event_id):
        db = current_app.get_db()
        data = request.get_json()
        user_id = str(data['user_id'])
        cursor = db.cursor()
        try:
            cursor.execute(
                "INSERT INTO event_attendees (event_id, user_id) VALUES (%s, %s)",
                (event_id, user_id)
            )
            db.commit()
        except Exception as e:
            if "Duplicate entry" in str(e):
                return jsonify({'success': False, 'error': 'Attendee already added.'}), 400
            return jsonify({'success': False, 'error': str(e)}), 400
        finally:
            cursor.close()
        return jsonify({'success': True})
    
    # Remove an attendee from an event
    @admin_blueprint.route('/api/events/<int:event_id>/attendees/<user_id>', methods=['DELETE'])
    def remove_event_attendee(event_id, user_id):
        db = current_app.get_db()
        cursor = db.cursor()
        cursor.execute(
            "DELETE FROM event_attendees WHERE event_id=%s AND user_id=%s",
            (event_id, user_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'success': True})
    
    # Former Users API routes
    @admin_blueprint.route('/api/former_users')
    def api_former_users():
        db = current_app.get_db()
        cursor = db.cursor( pymysql.cursors.DictCursor )
        page = int( request.args.get('page', 1) )
        per_page = int( request.args.get('per_page', 10) )
        offset = (page - 1) * per_page
        cursor.execute('SELECT * FROM former_users LIMIT %s OFFSET %s', (per_page, offset))
        former_users_list = cursor.fetchall()
        for user in former_users_list:
            user['user_id'] = str(user['user_id'])
            user['guild_id'] = str(user['guild_id'])
            user['left_date'] = user['left_date'].strftime('%Y-%m-%d')
        cursor.close()
        return jsonify(former_users_list)
    
    # Add a former user
    @admin_blueprint.route('/api/former_users', methods=['POST'])
    def add_former_user():
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        # Validate input
        try:
            datetime.strptime(data['left_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        try:
            cursor.execute(
                "INSERT INTO former_users (user_id, guild_id, left_date) VALUES (%s, %s, %s)",
                (str(data['user_id']), str(data['guild_id']), data['left_date'])
            )
            db.commit()
        except Exception as e:
            if "Duplicate entry" in str(e):
                return jsonify({'success': False, 'error': 'Former user already exists.'}), 400
            return jsonify({'success': False, 'error': str(e)}), 400
        finally:
            cursor.close()
        return jsonify({'success': True})

    # Delete a former user
    @admin_blueprint.route('/api/former_users/<user_id>/<guild_id>', methods=['DELETE'])
    def delete_former_user(user_id, guild_id):
        db = current_app.get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM former_users WHERE user_id=%s AND guild_id=%s", (user_id, guild_id))
        db.commit()
        cursor.close()
        return jsonify({'success': True})
    
    @admin_blueprint.route('/api/former_users/<user_id>/<guild_id>', methods=['PUT'])
    def update_former_user(user_id, guild_id):
        db = current_app.get_db()
        data = request.get_json()
        cursor = db.cursor()
        try:
            datetime.strptime(data['left_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        cursor.execute(
            "UPDATE former_users SET left_date=%s WHERE user_id=%s AND guild_id=%s",
            (data['left_date'], user_id, guild_id)
        )
        db.commit()
        cursor.close()
        return jsonify({'success': True})

    # Get Discord user information
    @admin_blueprint.route('/api/discord_user/<guild_id>/<user_id>')
    def get_discord_guild_member(guild_id, user_id):
        bot_ready.wait()  # Block until bot is ready
        guild = bot.get_guild(int(guild_id))
        if guild:
            member = guild.get_member(int(user_id))
            if not member:
                # Try REST fetch if not cached
                try:
                    member = asyncio.run_coroutine_threadsafe(
                        guild.fetch_member(int(user_id)), bot.loop
                    ).result()
                except Exception as e:
                    print(f"Error during REST fetch: {e}")
                    member = None
            if member:
                avatar_url = str(member.avatar.url) if member.avatar else None
                return jsonify({
                    "user": {
                        "username": member.name,
                        "avatar": avatar_url
                    }
                })
        return jsonify({}), 404

    return admin_blueprint