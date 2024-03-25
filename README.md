# rss-monitor
Node.js script that would run in background and send out a notification to your messenger once the RSS feed is updated.

The script currently supports:
- Telegram

## Getting Started

The script requires several environment variables in order to run:

```
# Define up to 100 Feed URLs following the naming convention below:
FEED_URL=
FEED_URL1=
FEED_URL2=

# Set poll interval in seconds
INTERVAL_SECONDS=

# Set desired method of notification
# Currently supported: telegram
NOTIFICATION_METHOD=

# For Telegram, the following settings are required (see instructions below):
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
```

You may specify these variables in `.env` file by cloning `.env.example`:

```
cp .env.example .env
```

### Running on Docker

This is the most convenient way to run this script - you only need a machine with docker installed:

```
docker compose up -d
```

This command will build the image and run it in background. The container will respawn on reboot or in case it exits with an error.

### Running Locally

Install the requirements and run the script as easy as:

```
npm i
node main.js
```

## Notification Settings

### Telegram

1. Get API key. In order to do that, create a new bot if you don't have one: https://core.telegram.org/bots/features#botfather and obtain its token which should be provided in the TELEGRAM_TOKEN variable
2. Get your Chat ID. If you want your bot to send you direct messages you'll need to get your user's chat ID. You can do this by contacting @userinfobot which will respond you with your ID. That will be TELEGRAM_CHAT_ID
