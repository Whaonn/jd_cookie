 # jd_cookie    有效期1-2月 自行测试

~~~
docker run -d --name jd_cookie -p 6789:6789 whaonn/jd_cookie:latest
~~~

## 可用参数
~~~
- UPDATE_API 修改ck接口地址
- QYWX_KEY 企业微信机器人的 webhook
- QYWX_AM 企业微信应用消息的值

#示例 docker run -d --name jd_cookie -p 6789:6789 -e QYWX_KEY=xxx -e QYWX_AM=xxx -e UPDATE_API=http://ip:5678/updateCookie whaonn/jd_cookie:latest
~~~
## 方法二
~~~
- docker-compose.yml 修改相关配置
- docker-compose up -d
~~~
## <a href="https://t.me/joinchat/1O91g5PT2Fg4YTgx">订阅频道</a>
## <a href="https://t.me/joinchat/BHOvEFvjPOM2OWJh">讨论群组</a>
