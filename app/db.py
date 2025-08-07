import pymysql
from flask import g, current_app

def get_db():
    if 'db' not in g:
        g.db = pymysql.connect(
            host=current_app.config.get('DB_HOST'),
            user=current_app.config.get('DB_USER'),
            password=current_app.config.get('DB_PASSWORD'),
            database=current_app.config.get('DB_NAME'),
            port=int(current_app.config.get('DB_PORT', 3306))
        )
        print("Connected!")
    return g.db