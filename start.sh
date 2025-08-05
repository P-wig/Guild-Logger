#!/bin/bash

# Limit Flask retries to 3
flask_retries=0
while [ $flask_retries -lt 3 ]; do
    python runserver.py
    flask_retries=$((flask_retries + 1))
    echo "Flask crashed or exited. Retry $flask_retries/3. Restarting in 5 seconds..."
    sleep 5
done &

# Limit Bot retries to 3
bot_retries=0
while [ $bot_retries -lt 3 ]; do
    python bot/bot.py
    bot_retries=$((bot_retries + 1))
    echo "Bot crashed or exited. Retry $bot_retries/3. Restarting in 5 seconds..."
    sleep 5
done

wait