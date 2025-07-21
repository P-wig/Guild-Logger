# GuildLogger Development Plan

## 📦 Project Overview
A Flask web app and Discord bot for monitoring, editing, and tracking Discord server user data and raid event participation via a MySQL database.

## ✅ Current Progress

### Database & Data Model
- [✅] Identify required user data: Discord user ID, join date, active/retired status
- [✅] Identify required event data: raid events, participant user IDs
- [✅] Design and implement SQL schema: Users, Events, Event_Attendees, Former_Users tables
- [✅] Set up MySQL database on Amazon Lightsail
- [✅] Seed database with initial user/event data

### Flask Web Dashboard
- [✅] Basic Flask app and route structure scaffolded
- [✅] Home page renders with React integration and navigation tabs
- [ ] Dashboard routes:
  - [✅] Home route
  - [ ] Guild route
- [ ] Build admin dashboard features:
  - [ ] List users with details
  - [ ] Edit user data (join date, status, etc.)
  - [ ] List and edit raid events and participants
  - [ ] Filter/search users/events
- [ ] Implement user authentication for dashboard access
- [ ] Apply consistent styling using CSS and React components

### Discord Bot Integration
- [✅] Set up virtual environment and install Flask + Discord.py
- [ ] Connect bot to Discord server
- [ ] Implement event hosting announcements (live usage)
- [ ] Sync event participation data from Discord to database
- [ ] Automate user/event updates in the database

### Deployment & DevOps
- [ ] Containerize app with Dockerfile
- [ ] Prepare for AWS deployment (Dockerrun.aws.json, environment variables)
- [ ] Deploy to Amazon Elastic Beanstalk (EBS) after Flask dashboard is complete
- [ ] Configure AWS networking/security for bot and database communication

## 📝 Next Steps
- Complete Flask dashboard CRUD functionality for users and events
- Add authentication and admin controls
- Integrate Discord bot with database for live event tracking
- Prepare deployment scripts and AWS resources after core features are ready

## 📌 Notes
- Use `.env` for tokens/keys and sensitive config
- Keep bot and web app loosely coupled
- Prioritize data integrity, admin usability,