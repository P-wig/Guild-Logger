# GuildLogger Development Plan

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
- [✅] Home route implemented
- [✅] Admin route (formerly Guild) implemented
- [ ] Build admin dashboard features:
  - [ ] List users with details
  - [ ] Edit user data (join date, status, etc.)
  - [ ] List and edit raid events and participants
  - [ ] Filter/search users/events
- [✅] Implement Discord OAuth2 login for authentication
- [✅] Restrict dashboard access to approved Discord users (admin/mods)
- [ ] Apply consistent styling using CSS and React components
- [✅] Add logout functionality
- [✅] Protect all admin routes with login/authorization checks
- [ ] Add user feedback for login/logout/errors

### Discord Bot Integration
- [✅] Set up virtual environment and install Flask + Discord.py
- [ ] Connect bot to Discord server
- [ ] Implement event hosting announcements (live usage)
- [ ] Sync event participation data from Discord to database
- [ ] Automate user/event updates in the database

### Web Security Checkpoints
- [ ] Ensure all sensitive routes (admin, edit, etc.) have server-side authentication and authorization checks.
- [ ] Never rely solely on hiding UI elements for security—always check permissions on the backend.
- [ ] Validate all user input on the server.
- [ ] Use HTTPS in production to protect user sessions.
- [✅] Use strong, secret session keys and environment variables for sensitive config.

### Planned Features for Multi-Server Support
- [ ] Refactor app to support multiple Discord servers (guilds)
- [ ] Use Discord OAuth2 to fetch list of servers the user owns or manages
- [ ] Allow server owners to select and manage their servers via a dropdown menu in the dashboard
- [ ] Dynamically determine authorized users based on Discord server ownership/roles, not static .env list
- [ ] Update database schema to associate users/events with specific Discord servers (guild IDs)
- [ ] Add admin dashboard features for server owners to manage their own server’s data

### Deployment & DevOps
- [✅] Containerize app with Dockerfile
- [ ] Prepare for AWS deployment (Dockerrun.aws.json, environment variables)
- [ ] Deploy to Amazon Elastic Beanstalk (EBS) after Flask dashboard is complete
- [ ] Configure AWS networking/security for bot and database communication

## 📝 Next Steps & Reminders
- Complete CRUD functionality for users and events in the admin dashboard
- Add and test logout route and session management
- Ensure all admin routes are protected by login and authorization checks
- Integrate Discord bot with database for live event tracking
- Prepare deployment scripts and AWS resources after core features are ready
- **Update `DISCORD_REDIRECT_URI` in `.env` and Discord Developer Portal when deploying to AWS**
- **Add your production domain to Discord OAuth2 Redirects before going live**
- Use `.env` for tokens/keys and sensitive config
- Keep bot and web app loosely coupled
- Prioritize data integrity, admin usability, and security

## 📌 Notes
- Use `.env` for tokens/keys and sensitive config
- Keep bot and web app loosely coupled
- Prioritize data integrity, admin usability,