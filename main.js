import axios from 'axios';
import Parser from 'rss-parser';
import { JSONFilePreset } from 'lowdb/node';

import * as dotenv from 'dotenv';
dotenv.config();

const SUPPORTED_NOTIFICATION_METHODS = ['telegram'];

if (!SUPPORTED_NOTIFICATION_METHODS.includes(process.env.NOTIFICATION_METHOD)) {
  console.error(`NOTIFICATION_METHOD should be one of the following: ${SUPPORTED_NOTIFICATION_METHODS.toString()}. Exiting`);
  process.exit(1);
}

if (!Number.isInteger(+process.env.INTERVAL_SECONDS)) {
  console.error(`INTERVAL_SECONDS is required and has to be a positive integer. Exiting`);
  process.exit(1);
}

(async () => {
  let feedURLs = [];
  const intervalMilliseconds = +process.env.INTERVAL_SECONDS * 1000;

  for (let i = 0; i < 100; i++) {
    const feedURL = process.env[`FEED_URL${i ? i : ''}`];
    if (feedURL) {
      feedURLs.push(feedURL);
    }
  }

  if (!feedURLs.length) {
    console.error('No feeds set up. Exiting');
    process.exit(1);
  }

  runner(feedURLs, intervalMilliseconds);
})();

function runner(feedURLs, intervalMilliseconds) {
  worker(feedURLs).then(() => {
    setTimeout(() => {
      runner(feedURLs, intervalMilliseconds);
    }, intervalMilliseconds);
  }).catch((e) => {
    console.error(e);
  });
}

async function worker(feedURLs) {
  const db = await JSONFilePreset('db.json', {
    feeds: {
      /* [FEED_URL]: {
        lastPostIsoDate: string;
      } */
    },
  });
  const parser = new Parser();

  for (const feedURL of feedURLs) {
    const feed = await parser.parseURL(feedURL);
    const dbRecord = db.data.feeds[feedURL];

    const newestItems = dbRecord?.lastPostIsoDate ? feed.items.filter(({ isoDate }) => {
      if (!isoDate) {
        return false;
      }

      const itemDate = new Date(isoDate);
      const lastPostDate = new Date(dbRecord.lastPostIsoDate);

      return (itemDate > lastPostDate);
    }) : feed.items;

    console.log(`Read ${feedURL}`);

    if (!newestItems.length) {
      console.log('No new items this time');
      continue;
    }

    if (process.env.NOTIFICATION_METHOD === 'telegram') {
      let text = `New items from feed ${feed.title}:\n\n`;
      text += newestItems.map(({ title, link }, index) => `${index + 1}. ${title}\n${link}`).join('\n\n');

      const params = {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
      };

      try {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
          null,
          { params },
        );
      } catch (e) {
        console.error('Error communicating with Telegram API:');
        throw e;
      }
    }

    console.log(`Sent a notification with ${newestItems.length} new items`);

    db.update(({ feeds }) => {
      if (!feeds[feedURL]) {
        feeds[feedURL] = {}
      }

      feeds[feedURL].lastPostIsoDate = newestItems[0].isoDate;
    });
  }
}
