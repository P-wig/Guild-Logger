from markupsafe import escape #protects projects against injection attacks
import sys 
sys.dont_write_bytecode = True
from flask import Blueprint, render_template

def get_blueprint():
    guild_blueprint = Blueprint('guild', __name__, url_prefix='/guild')

    @guild_blueprint.route('/')
    def render_guild_page():
        return render_template('guild.html')

    return guild_blueprint