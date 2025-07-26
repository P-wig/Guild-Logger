#!/bin/bash
while true; do
    python runserver.py
    echo "Flask crashed or exited. Restarting in 5 seconds..."
    sleep 5
done &

while true; do
    python bot/bot.py
    echo "Bot crashed or exited. Restarting in 5 seconds..."
    sleep 5
done

wait