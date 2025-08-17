import os
import discord
from discord.ext import commands
from dotenv import load_dotenv
import threading

load_dotenv()  # Loads .env file at project root

TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.all()  # Enables all privileged and non-privileged intents

bot = commands.Bot(command_prefix="!", intents=intents)

bot_ready = threading.Event()

@bot.event  # Decorator to register an event listener to discord.py
async def on_ready():  # discord event triggered when the bot is connected to Discord
    print(f"Bot connected as {bot.user}")  # prints the bot's username
    print("Cached guilds:")
    for guild in bot.guilds:
        print(f"- {guild.name} (ID: {guild.id})")
    print(f"Total cached guilds: {len(bot.guilds)}")
    # Optionally, print member count for each guild
    for guild in bot.guilds:
        print(f"Guild '{guild.name}' has {guild.member_count} members cached.")
    bot_ready.set()
    try:
        synced = await bot.tree.sync()  # tells Discord about our slash commands
        print(f"Synced {len(synced)} slash commands.") 
    except Exception as e:
        print(f"Error syncing commands: {e}")

async def load_cogs():
    for filename in os.listdir(os.path.join(os.path.dirname(__file__), "cogs")):
        if filename.endswith(".py") and not filename.startswith("_"):
            extension = f"cogs.{filename[:-3]}"
            try:
                await bot.load_extension(extension)
                print(f"Loaded extension: {extension}")
            except Exception as e:
                print(f"Failed to load extension {extension}: {e}")

# cogs will be defined and loaded in the cogs directory

# Bot startup
def start_bot():
    bot.run(TOKEN)