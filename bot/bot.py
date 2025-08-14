import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()  # Loads .env file at project root

TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True  # Needed for message commands

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event  # Decorator to register an event listener to discord.py
async def on_ready():  # discord event triggered when the bot is connected to Discord
    print(f"Bot connected as {bot.user}")  # prints the bot's username
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