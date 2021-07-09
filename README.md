# 🎲 True Random

![NodeJs](https://img.shields.io/badge/Powered%20By-NodeJS-68A063?style=for-the-badge)
![LINES OF CODE](https://img.shields.io/tokei/lines/github/Questionable-Research-Labs/TrueRandom-MainServer?style=for-the-badge)
![LICENSE](https://img.shields.io/github/license/Questionable-Research-Labs/TrueRandom-MainServer?style=for-the-badge)

The ultimate military grade random number generator.

## ❓ What is this

This is main server portion of True-Random this handles incoming connections and API calls and then transmits them to
the dice rolling nodes. This is also what contains the main page for the site along with styling and other resources for
it.

## 📦 Docker

This project already has a Dockerfile for setup and ready to use so with a few commands you can easily spin up a docker
image with this server running on it.

## ⚙️ Setup

To setup the application you required a NodeJS installation of ``v14.16.0`` or greater (only tested on this version)

You then need to run the following command to get the required dependencies

```bash
npm install --production
```

Then to start the application  run (you can use yarn instead of npm)


```bash
npm run start:live
```

or if you would like to start the application in a development environment where
changes will restart the server you can run the following instead

```bash
npm run start
```

## 📝 Environment

The following environment variables are required to run

| Variable   | Example | Explanation                           |
|------------|---------|---------------------------------------|
| PORT       | 8080    | The port in which the app will run on |
| DEBUG      | false   | Logs additional information about connections etc |
| SECURE_KEY |         | The password the websocket clients will authenticate with |

The following environment variables are optional

| Variable           | Example | Explanation                           |
|--------------------|---------|---------------------------------------|
| RATE_BYPASS_KEY    | true    | A Key that can be provided to ignore rate limiting |
| RATE_LIMIT_MINUTES | true    | The amount of minutes before rate limiting resets |
| RATE_LIMIT_TOTAL   | true    |  The amount of requests to accept before rate limiting |


