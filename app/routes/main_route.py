import sys 
sys.dont_write_bytecode = True
from flask import render_template, Blueprint


#The mail_user_name and mail_app_password values are in the .env file
#Google requires an App Password as of May, 2022: 
#https://support.google.com/accounts/answer/6010255?hl=en&visit_id=637896899107643254-869975220&p=less-secure-apps&rd=1#zippy=%2Cuse-an-app-password



def get_blueprint():
    main_blueprint = Blueprint('main', __name__)

    @main_blueprint.route('/')
    def render_home_page():
        return render_template('home.html')

    return main_blueprint

