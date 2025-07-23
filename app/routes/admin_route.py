from markupsafe import escape #protects projects against injection attacks
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template

def get_blueprint():
    admin_blueprint = Blueprint('admin', __name__, url_prefix='/admin')

    @admin_blueprint.route('/')
    def render_admin_page():
        return render_template('admin.html')

    return admin_blueprint