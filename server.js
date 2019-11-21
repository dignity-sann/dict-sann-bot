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
    console.log(req.body.events);

    //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
    if(req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff'){
        res.send('Hello LINE BOT!(POST)');
        console.log('疎通確認用');
        return; 
    }

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

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

const dogImage = async (userId) => {
  const limit = 1;
  const offset = Math.floor(Math.random() * Math.floor(100));
  const res = await axios.get(`http://api.photozou.jp/rest/search_public.json?type=photo&keyword=dog&limit=${limit}&offset=${offset}`);
  const items = res.data;
  if (items.stat !== 'ok') {
    return client.pushMessage(userId, {
      type: 'text',
      text: 'なにかおかしい'
    });
  }
  if (items.info.photo_num < 0) {
    return client.pushMessage(userId, {
      type: 'text',
      text: 'なかったよ・・・'
    });
  } else {
    return client.pushMessage(userId, {
      type: 'image',
      originalContentUrl: items.info.photo[0].original_image_url,
      previewImageUrl: items.info.photo[0].thumbnail_image_url
    });
  }
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
