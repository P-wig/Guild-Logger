import os
import openai
from openai import OpenAI
import re #regular expressions module
from markupsafe import escape #protects projects against injection attacks
from intro_to_flask import app
import sys 
sys.dont_write_bytecode = True
from flask import render_template, request, Flask, Blueprint
from .create_speech_form import create_speechForm

create_speech_blueprint = Blueprint('create_speech', __name__)

@create_speech_blueprint.route('/create_speech',methods=['GET', 'POST'])
@app.route('/create_speech',methods=['GET', 'POST'])
def create_speech():
  form = create_speechForm(request.form)
  
  if request.method == 'POST':
      if form.validate() == False:
        return render_template('create_speech.html', form=form)
      else:
        # The following response code adapted from example on: 
        # https://platform.openai.com/docs/api-reference/images
        client = OpenAI()

        response = client.audio.speech.create(
          model="tts-1",
          voice="alloy",
          input=form.prompt.data,
        )
        response.stream_to_file("output.mp3")      
  elif request.method == 'GET':
      return render_template('create_speech.html', form=form)