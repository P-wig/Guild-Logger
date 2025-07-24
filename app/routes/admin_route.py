from markupsafe import escape #protects projects against injection attacks
import os
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template, session

def get_blueprint():
    admin_blueprint = Blueprint('admin', __name__, url_prefix='/admin')

    @admin_blueprint.route('/')
    def render_admin_page():
        # Check if the user is logged in and has permission to access the admin page
        allowed_users = [uid.strip() for uid in os.getenv('ALLOWED_USERS', '').split(',')]
        if not session.get('user') or session['user']['id'] not in allowed_users:
            return render_template('access_denied.html'), 403
        
        return render_template('admin.html')

    return admin_blueprint