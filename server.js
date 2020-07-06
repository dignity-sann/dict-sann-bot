'use strict';

const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;
const CHANNEL_SECRET_KEY = process.env.CHANNEL_SECRET_KEY
const ACCESS_TOKEN = process.env.ACCESS_TOKEN

const config = {
    channelSecret: `${CHANNEL_SECRET_KEY}`,
    channelAccessToken: `${ACCESS_TOKEN}`
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

app.get('/notice', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(notice))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

function notice(event) {
  const message = {
    type: 'text',
    text: 'Hello World!'
  };
  
  client.pushMessage('U80c44846baad73387e7e0a9987f3ed0c', message)
}

function handleEvent(event) {

  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  let message = 'わからないよ';
  switch (event.message.text) {
    case '犬':
      message = '検索するよ';
      dogImage(event.source.userId);
      break;
  
    default:
      break;
  }
  let replyMessage = {
    type: 'text',
    text: message
  }
  return client.replyMessage(event.replyToken, replyMessage);
}


app.listen(PORT);
console.log(`Server running at ${PORT}`);
