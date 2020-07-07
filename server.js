'use strict';

const puppeteer = require('puppeteer');
const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;
const GAKKOU_URL = process.env.GAKKOU_URL
const GAKKOU_USER_ID = process.env.GAKKOU_USER_ID
const GAKKOU_PASSWORD = process.env.GAKKOU_PASSWORD
const SENDING_USER_ID = process.env.SENDING_USER_ID
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

app.get('/notice', (req, res) => {
  notice();
  res.send(200);
});

const client = new line.Client(config);

async function notice() {
  console.log(`notice start`)
  const msg = await (async () => {
    let message = '';
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    const page = await browser.newPage();
    const iPhone = puppeteer.devices['iPhone X'];
    await page.emulate(iPhone);
    // initial page
    await page.goto(`${GAKKOU_URL}`);
    // login button click
    await Promise.all([
      page.waitForNavigation(),
      page.click('#lnkToLogin')
    ]);
    await page.waitFor(3000);
    // login page
    // iframe select
    let frame = await page.frames().find(f => f.name() === 'frameMenu');
    // input
    await frame.type('#txtKyoushuuseiNO', `${GAKKOU_USER_ID}`);
    await frame.type('#txtPassword', `${GAKKOU_PASSWORD}`);
    // login button click
    await Promise.all([
      frame.waitForNavigation(),
      frame.click('#btnAuthentication')
    ]);
    // menu page
    frame = await page.frames().find(f => f.name() === 'frameMenu');
    await Promise.all([
      frame.waitForNavigation(),
      frame.click('#btnMenu_Kyoushuuyoyaku')
    ]);
    // target page
    frame = await page.frames().find(f => f.name() === 'frameMenu');
    const result = await frame.evaluate(() => {
      let result = []
      Array.from(document.querySelectorAll('.blocks')).forEach((v) => {
        if (v.children[1].innerText === '×') {
          return false
        }
        result.push({
          'label': v.children[0].innerText,
          'result': v.children[1].innerText
        })
      })
      return result
    });
    if (result.length > 0) {
      message = `通知しますー`
      result.forEach(v => {
        message += v.label + ' が空いてます！'
      })
    }
    await browser.close();
    return message
  })();
  console.log(`notice end`)
  if (msg) {
    return client.pushMessage(`${SENDING_USER_ID}`, {
      type: 'text',
      text: msg
    })  
  } else {
    return
  }
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
