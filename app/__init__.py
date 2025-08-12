import sys
import os
import importlib
import inspect
from dotenv import load_dotenv
sys.dont_write_bytecode = True
from flask import Flask
from authlib.integrations.flask_client import OAuth


# Check if the environment variable RAILWAY_ENVIRONMENT is set
# If it is set, we assume we are running on Railway and do not load .env
# This is to prevent loading .env in production where it might not be needed or could cause issues
if os.environ.get("RAILWAY_ENVIRONMENT"):
    # On Railway, do not load .env
    pass
else:
    # Local development: load .env
    load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv('SECRET_KEY')
    app.config['SECRET_KEY'] = app.secret_key

    app.config['DB_HOST'] = os.getenv('DB_HOST')
    app.config['DB_PORT'] = os.getenv('DB_PORT')
    app.config['DB_USER'] = os.getenv('DB_USER')
    app.config['DB_PASSWORD'] = os.getenv('DB_PASSWORD')
    app.config['DB_NAME'] = os.getenv('DB_NAME')

    from app.db import get_db
    app.get_db = get_db

    # Add teardown function to close DB connection
    @app.teardown_appcontext
    def close_db(exception):
        from flask import g
        db = g.pop('db', None)
        if db is not None:
            db.close()

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
