from flask import Blueprint, redirect, url_for, session, current_app
from authlib.integrations.flask_client import OAuth
import os
import sys 
sys.dont_write_bytecode = True

def get_blueprint(oauth):
    auth_blueprint = Blueprint('auth', __name__)

    discord = oauth.register(
        name='discord',
        client_id=os.getenv('DISCORD_CLIENT_ID'),
        client_secret=os.getenv('DISCORD_CLIENT_SECRET'),
        access_token_url='https://discord.com/api/oauth2/token',
        authorize_url='https://discord.com/api/oauth2/authorize',
        api_base_url='https://discord.com/api/',
        client_kwargs={'scope': 'identify'},
    )

    @auth_blueprint.route('/auth/discord/login')
    def login():
        redirect_uri = os.getenv('DISCORD_REDIRECT_URI')
        return discord.authorize_redirect(redirect_uri)

    @auth_blueprint.route('/auth/discord/logout')
    def logout():
        session.pop('user', None)
        return redirect(url_for('main.render_home_page'))

    @auth_blueprint.route('/auth/discord/callback')
    def callback():
        token = discord.authorize_access_token()
        user = discord.get('users/@me').json()
        allowed_users = [uid.strip() for uid in os.getenv('ALLOWED_USERS', '').split(',')]
        if user['id'] not in allowed_users:
            return "Access denied: You are not an admin.", 403
        session['user'] = user
        return redirect(url_for('main.render_home_page'))

    return auth_blueprint