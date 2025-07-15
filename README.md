# Guild-Logger Development Plan

## 📦 Project Overview
A Flask web app and Discord bot for monitoring, editing, and tracking Discord server user data and raid event participation via a SQL database.

## ✅ Goals

### Database & Data Model
- [✅] Identify required user data: Discord user ID, join date, active/retired status
- [✅] Identify required event data: raid events, participant user IDs
- [ ] Design and implement SQL schema: Users and Events tables
- [ ] Set up database (MySQL via amazon lightsail)
- [ ] Seed database with initial data (if needed)

### Flask Web Dashboard
- [ ] Initialize Flask app with basic route
- [ ] Create admin dashboard for:
  - [ ] Viewing user list and details
  - [ ] Editing user data (join date, status, etc.)
  - [ ] Viewing and editing raid events and participants
  - [ ] Filtering/searching users/events
- [ ] User authentication for dashboard access

### Discord Bot Integration
- [✅] Set up virtual environment and install Flask + Discord.py
- [ ] Connect bot to Discord server
- [ ] Implement event hosting announcements (live usage)
- [ ] Sync event participation data from Discord to database

### Deployment & DevOps
- [ ] Set up Dockerfile
- [ ] Write `Dockerrun.aws.json` for AWS deployment
- [ ] Deploy with Elastic Beanstalk CLI

## 📌 Notes
- Use `.env` for tokens/keys
- Keep bot and web app loosely coupled
- Prioritize data integrity and admin usability