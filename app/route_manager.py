import os
import openai
import re #regular expressions module
from markupsafe import escape #protects projects against injection attacks
#from app import app
import sys 
sys.dont_write_bytecode = True
from flask import render_template, request, Flask, Blueprint
from .routes.guild_route import guild_blueprint


#The mail_user_name and mail_app_password values are in the .env file
#Google requires an App Password as of May, 2022: 
#https://support.google.com/accounts/answer/6010255?hl=en&visit_id=637896899107643254-869975220&p=less-secure-apps&rd=1#zippy=%2Cuse-an-app-password



main_blueprint = Blueprint('main', __name__)

@main_blueprint.route('/')
def home():
  return render_template('home.html')

       
all_blueprints = [
    main_blueprint,
    guild_blueprint
]
