# Scribecord
🎤 An easy-to-use text-to-speech, speech-to-text, and recording bot!

## About
This bot was made in about a week. It was made to be a nice TTS/VTT bot, however I'll admit the VTT side of things are not the best.

## Setup
Want to run your own version of the bot? Awesome! Just follow the steps below.

### Step 1: Install Dependencies
```bash
  npm install
  yarn install
```

### Step 2: Download Model
This step is REQUIRED to run the bot. Voice to text uses Vosk, so please click the link below and download a model.

[Vosk Models](https://alphacephei.com/vosk/models)

When you get to the page, there are many models. Download the one that you think will be the most accurate for your server. I would go with "vosk-model-en-us-0.22", however you should choose the model that is the best for both server specs and how accurate you want it to be.

### Step 3: 
After downloading it, please create a new folder called "models" in the main directory of this bot. **It should NOT be in src**. Move the model you just downloaded, which should be a folder of data, to the new folder you nammed "models". Now, rename the model you just put in the models folder as "model".

### Done!
Thank you for completing these steps. Your new voice bot is ready!

## Support
Need help setting up Scribecord? Join [Ch1ll Zone](https://discord.gg/PPtzT8Mu3h) on Discord. We can help!
