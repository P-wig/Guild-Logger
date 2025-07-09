import sys 
sys.dont_write_bytecode = True
from flask import Flask


#app = Flask(__name__)

#app.secret_key = 'development key'
#app.config['SECRET_KEY']='LongAndRandomSecretKey'


def create_app():
    app = Flask(__name__)
    app.secret_key = 'development key'
    app.config['SECRET_KEY']='LongAndRandomSecretKey'

    # Mail config
    import os
    mail_user_name = os.getenv('GMAIL_USER_NAME')
    mail_app_password = os.getenv('GMAIL_APP_PASSWORD')
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = mail_user_name
    app.config['MAIL_PASSWORD'] = mail_app_password
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True

    from .routes import mail, all_blueprints
    mail.init_app(app)
    for bp in all_blueprints:
        app.register_blueprint(bp)

    return app
