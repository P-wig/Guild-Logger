from flask import Blueprint, render_template

guild_blueprint = Blueprint('guild', __name__, url_prefix='/guild')

@guild_blueprint.route('/')
def guild_page():
    return render_template('guild.html')