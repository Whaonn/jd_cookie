// 填入你的配置，或者通过环境变量传入
const QYWX_KEY =
  process.env.QYWX_KEY && process.env.QYWX_KEY.length > 0
    ? process.env.QYWX_KEY
    : '';
// 尽量不用@all，除非只有你一个人
const QYWX_AM =
  process.env.QYWX_AM && process.env.QYWX_AM.length > 0
    ? process.env.QYWX_AM
    : '';
// 支持多个服务器推送，用|隔开 http://1.com/updateCookie|http://2.com/updateCookie
const UPDATE_API =
  process.env.UPDATE_API && process.env.UPDATE_API.length > 0
    ? process.env.UPDATE_API
    : '';

const express = require('express');
const got = require('got');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
//扫码接口 介意勿用
const remoteHost = 'http://jd.ootnoy.top';

/**
 * 发送消息推送
 *
 * @param {*} msg
 */
async function sendMsg(updateMsg, cookie, userMsg) {
  // 企业微信群机器人
  if (QYWX_KEY) {
    try {
      await got.post(
        `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${QYWX_KEY}`,
        {
          responseType: 'json',
          json: {
            msgtype: 'text',
            text: {
              content: `====获取到cookie====\n${updateMsg}\n用户备注：${userMsg}\n${cookie}`,
            },
          },
        }
      );
    } catch (err) {
      console.log({
        msg: '企业微信群机器人消息发送失败',
      });
    }
  }
  if (QYWX_AM) {
    try {
      const [corpid, corpsecret, userId, agentid] = QYWX_AM.split(',');
      const getToken = await got.post({
        url: `https://qyapi.weixin.qq.com/cgi-bin/gettoken`,
        json: {
          corpid,
          corpsecret,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      const accessToken = JSON.parse(getToken.body).access_token;
      const res = await got.post({
        url: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        json: {
          touser: userId,
          agentid,
          safe: '0',
          msgtype: 'text',
          text: {
            content: `====获取到cookie====\n${updateMsg}\n用户备注：${userMsg}\n${cookie}`,
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    } catch (err) {
      console.log({
        msg: '企业微信应用消息发送失败',
      });
    }
  }
}

/**
 * 自动更新服务
 *
 * @param {*} ucookie
 * @return {string} msg
 *
 */
async function updateCookie(cookie, userMsg) {
  let msg = '';
  if (UPDATE_API) {
    try {
      if (UPDATE_API.split('|').length > 1) {
        const updateHosts = UPDATE_API.split('|');
        let hostIndex = 1;
        for await (const updateUrl of updateHosts) {
          console.log(updateUrl);
          try {
            const res = await got.post({
              url: updateUrl,
              json: {
                cookie,
                userMsg,
                defaultStatus: false,
                defaultName: userMsg,
                defaultWeight: 1,
              },
              timeout: 10000,
            });
            console.log(res.body);
            msg += `服务器${hostIndex}:${JSON.parse(res.body).msg}\n`;
          } catch (error) {
            msg += `服务器${hostIndex}:更新失败\n`;
          }
          hostIndex += 1;
        }
        return msg;
      } else if (UPDATE_API.startsWith('http')) {
        const res = await got.post({
          url: UPDATE_API,
          json: {
            cookie,
            userMsg,
            defaultStatus: false,
            defaultName: userMsg,
            defaultWeight: 1,
          },
          timeout: 10000,
        });
        msg += JSON.parse(res.body).msg;
        return msg;
      } else {
        return '更新地址配置错误';
      }
    } catch (err) {
      // console.log(err);
      console.log({
        msg: 'Cookie 更新接口失败',
      });
      return '';
    }
  }
  return '';
}

/**
 * 对ck进行处理的流程
 *
 * @param {*} cookie
 * @return {*}
 */
async function cookieFlow(cookie, userMsg) {
  try {
    const updateMsg = await updateCookie(cookie, userMsg);
    await sendMsg(updateMsg, cookie, userMsg);
    return msg;
  } catch (err) {
    return '';
  }
}

/**
 * API 获取二维码链接
 */
app.get('/qrcode', async function (request, response) {
  try {
    const res = await got.get(`${remoteHost}/qrcode`, {
      responseType: 'json',
    });
    console.log(res.body);
    response.send(res.body);
  } catch (err) {
    console.log(err);
    response.send({ err: 2, msg: '错误' });
  }
});

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * API 获取返回的cookie信息
 */
app.post('/cookie', async function (request, response) {
  const user = request.body.user;
  const userMsg = request.body.msg;
  if (user && user.state != '') {
    (async () => {
      try {
        const res = await got.post({
          responseType: 'json',
          url: `${remoteHost}/cookie?t=${+new Date()}`,
          json: {
            user,
          },
          timeout: 10000,
        });
        if (res.body.err == 0) {
          let userCookie = res.body.cookie;
          await cookieFlow(userCookie, userMsg);
          response.send({
            err: 0,
            cookie: userCookie,
            msg: '更新成功'
          });
        } else {
          response.send({
            err: res.body.err,
          });
        }
      } catch (err) {
        response.send({ err: 1, msg: err });
      }
    })();
  } else {
    response.send({ err: 2, msg: '获取失败' });
  }
});



app.use(express.static(path.join(__dirname, 'public')));

// 本地运行开启以下
const PORT = 6789;
app.listen(PORT, () => {
  console.log(`应用正在监听 ${PORT} 端口!`);
});

// 云函数运行开启以下
module.exports = app;
