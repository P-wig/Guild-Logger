import os
import openai
import re #regular expressions module
from markupsafe import escape #protects projects against injection attacks
#from app import app
import sys 
sys.dont_write_bytecode = True
from flask import render_template, request, Flask, Blueprint
from flask_mail import Message, Mail
from .contact_form import ContactForm
from .routes.ask_route import ask_blueprint
from .routes.about_route import about_blueprint
from .routes.create_speech_route import create_speech_blueprint


#The mail_user_name and mail_app_password values are in the .env file
#Google requires an App Password as of May, 2022: 
#https://support.google.com/accounts/answer/6010255?hl=en&visit_id=637896899107643254-869975220&p=less-secure-apps&rd=1#zippy=%2Cuse-an-app-password

mail_user_name = os.getenv('GMAIL_USER_NAME')
mail_app_password = os.getenv('GMAIL_APP_PASSWORD')
openai.api_key = os.getenv('OPENAI_API_KEY')


main_blueprint = Blueprint('main', __name__)

mail = Mail()

@main_blueprint.route('/')
def home():
  return render_template('home.html')

@main_blueprint.route('/contact', methods=['GET', 'POST'])
def contact():
  # Flask 2.2.2 requires a parameter to a form object: request.form or other
	# See https://stackoverflow.com/questions/10434599/get-the-data-received-in-a-flask-request
  form = ContactForm(request.form) 

  if request.method == 'POST':
      if form.validate() == False:
        return render_template('contact.html', form=form)
      else:
        msg = Message(form.subject.data, sender=mail_user_name, recipients=[form.email.data])
        msg.body = """From: %s <%s> \n%s \n%s
        """ % (form.name.data, form.email.data, form.subject.data, form.message.data)
        mail.send(msg)

        return render_template('contact.html', success=True)

  elif request.method == 'GET':
      return render_template('contact.html', form=form)
       
all_blueprints = [
    main_blueprint,
    about_blueprint,
    ask_blueprint,
    create_speech_blueprint,
]
