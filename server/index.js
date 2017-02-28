import Hull from "hull";
import express from "express";

import Server from "./server";
import { name } from "../manifest.json";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: name,
    port: process.env.LOGSTASH_PORT || 1515,
    host: process.env.LOGSTASH_HOST
  });
  Hull.logger.info("start", { transport: "logstash" });
} else {
  Hull.logger.info("start", { transport: "console" });
}

const hostSecret = process.env.SECRET || "1234";

const connector = new Hull.Connector({
  hostSecret,
  port: process.env.PORT || 8082
});
const app = express();
connector.setupApp(app);

Server(app, {
  Hull,
  connector,
  redisUrl: process.env.REDIS_URL,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

connector.startApp(app);
