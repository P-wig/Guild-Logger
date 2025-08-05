# GuildLogger Development Plan

## 📦 Project Overview
A Flask web app and Discord bot for monitoring, editing, and tracking Discord server user data and raid event participation via a managed SQL database.

## ✅ Current Progress

### Database & Data Model
- [✅] Identify required user data: Discord user ID, join date, active/retired status
- [✅] Identify required event data: raid events, participant user IDs
- [✅] Design and implement SQL schema: Users, Events, Event_Attendees, Former_Users tables
- [✅] Set up managed database on Railway (MySQL or PostgreSQL) or PlanetScale (MySQL)
- [✅] Seed database with initial user/event data

### Flask Web Dashboard
- [✅] Basic Flask app and route structure scaffolded
- [✅] Home page renders with React integration and navigation tabs
- [✅] Home route implemented
- [✅] Admin route (formerly Guild) implemented
- [ ] Build admin dashboard features:
  - [ ] Create a tabbed interface with a sub-tab for each database table (`users`, `events`, `event_attendees`, `former_users`)
  - [ ] For each table, display all rows in a scrollable menu/list UI
  - [ ] For each row, add an "Edit" button that opens a form or modal for editing that row’s data
  - [ ] On save, update the row in the database and refresh the UI
  - [ ] Add "Add New" and "Delete" buttons for CRUD operations as needed
  - [ ] Ensure all changes are reflected in the database in real time
  - [ ] Secure all endpoints with server-side authentication and authorization
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

### Deployment & DevOps (Railway)
- [✅] Containerize app with Dockerfile
- [✅] Create a new Railway project and connect your GitHub repo or upload your code
- [✅] Add a Railway-managed database (MySQL)
- [✅] Import SQL data into Railway database using the MySQL CLI
- [✅] Set environment variables in Railway dashboard
- [ ] Deploy Flask app and Discord bot via Railway’s Docker support
- [ ] Update Discord OAuth2 Redirect URI to Railway’s provided domain


## 📝 Next Steps & Reminders
- Complete CRUD functionality for users and events in the admin dashboard
- Add and test logout route and session management
- Ensure all admin routes are protected by login and authorization checks
- Integrate Discord bot with database for live event tracking
- Prepare deployment scripts for Railway
- **Update `DISCORD_REDIRECT_URI` in Railway environment variables and Discord Developer Portal when deploying**
- **Add your Railway production domain to Discord OAuth2 Redirects before going live**
- Use Railway’s environment variable dashboard for tokens/keys and sensitive config
- Keep bot and web app loosely coupled
- Prioritize data integrity, admin usability, and security

## 📌 Notes
- Use Railway’s environment variable dashboard for tokens/keys and sensitive config
- Keep bot and web app loosely coupled
- Prioritize data integrity, admin usability, and security

---

## 🚀 Railway Deployment Quickstart

1. **Sign up at [Railway](https://railway.app/)** and create a new project.
2. **Add a new service:**  
   - Choose "Deploy from GitHub".
3. **Add a database:**  
   - Click "Add Plugin" → choose MySQL.
   - Copy the connection string and set it as your `DB_URL` or equivalent environment variable.
4. **Set environment variables:**  
   - Add all secrets and config from your `.env` file in the Railway dashboard.
5. **Deploy:**  
   - Railway will build and deploy your app automatically.
6. **Update your Discord OAuth2 Redirect URI** to use your Railway domain.