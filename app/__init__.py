import sys
import importlib
sys.dont_write_bytecode = True
from flask import Flask


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

    # Dynamically import all route modules and register their blueprints
    routes_dir = os.path.join(os.path.dirname(__file__), 'routes') # find the routes directory
    for filename in os.listdir(routes_dir): # begins to loop through all files in the routes directory
        if filename.endswith('_route.py'): # filters for files that end with _route.py
            module_name = f"app.routes.{filename[:-3]}" # constructs the module name by removing the .py extension
            module = importlib.import_module(module_name) # imports the module dynamically
            if hasattr(module, "get_blueprint"): # checks module for get_blueprint function
                app.register_blueprint(module.get_blueprint())
            else:
                print(f"Module {module_name} does not have a get_blueprint function")
        else:
            print(f"File {filename} does not match *_route.py pattern")

    return app
