# Guild-Logger Development Plan

## 📦 Project Overview
A Flask web app + Discord bot that tracks user event attendance for a Roblox community via a SQL database.

## ✅ Goals
- Track event participation and log to a database
- Identify inactive users
- Admin dashboard for search/query
- Discord bot for attendance logging


## 🛠️ Development Steps

### Step 1: Project Setup
- [X] Set up virtual environment and install Flask + Discord.py
- [ ] Initialize Flask app + basic route
- [ ] Set up Dockerfile 

### Step 2: Discord Bot MVP
- [ ] Connect bot to Discord

### Step 3: Database Integration
- [ ] Design schema: Members, Events, Attendance
- [ ] Hook up SQLite/PostgreSQL
- [ ] Store bot messages into DB

### Step 4: Flask Dashboard
- [ ] Create admin panel
- [ ] View events, filter by date/user
- [ ] Inactive user report

### Step 5: AWS Deployment (EBS)
- [ ] Write `Dockerrun.aws.json`
- [ ] Deploy with Elastic Beanstalk CLI


## 📌 Notes
- Use `.env` for tokens/keys
- Keep bot and web app loosely coupled