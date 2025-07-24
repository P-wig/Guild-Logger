import sys
import os
import importlib
import inspect
from dotenv import load_dotenv
sys.dont_write_bytecode = True
from flask import Flask
from authlib.integrations.flask_client import OAuth

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv('SECRET_KEY')
    app.config['SECRET_KEY'] = app.secret_key

    oauth = OAuth(app)

    # Dynamically import all route modules and register their blueprints
    routes_dir = os.path.join(os.path.dirname(__file__), 'routes') # find the routes directory
    for filename in os.listdir(routes_dir): # begins to loop through all files in the routes directory
        if filename.endswith('_route.py'): # filters for files that end with _route.py
            module_name = f"app.routes.{filename[:-3]}" # constructs the module name by removing the .py extension
            module = importlib.import_module(module_name) # imports the module dynamically
            if hasattr(module, "get_blueprint"): # checks module for get_blueprint function
                # Check if get_blueprint expects an argument (for oauth)
                if len(inspect.signature(module.get_blueprint).parameters) == 1:
                    app.register_blueprint(module.get_blueprint(oauth))
                else:
                    app.register_blueprint(module.get_blueprint())
            else:
                print(f"Module {module_name} does not have a get_blueprint function")
        else:
            print(f"File {filename} does not match *_route.py pattern")

    return app
