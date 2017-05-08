/* @flow */
import Hull from "hull";
import express from "express";

import Server from "./server";
import { name } from "../manifest.json";
import * as StoreTypes from "./storeTypes";

const {
  LOG_LEVEL,
  LOGSTASH_HOST,
  LOGSTASH_PORT = 1515,
  SECRET = "1234",
  PORT = 8082,
  REDIS_URL,
  CLIENT_ID,
  CLIENT_SECRET
} = process.env;

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

if (LOGSTASH_HOST && LOGSTASH_PORT) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: name,
    port: LOGSTASH_PORT,
    host: LOGSTASH_HOST
  });
  Hull.logger.info("start", { transport: "logstash" });
} else {
  Hull.logger.info("start", { transport: "console" });
}

const hostSecret = SECRET;

const connector = new Hull.Connector({
  hostSecret,
  port: PORT
});
const app = express();
connector.setupApp(app);

const store = StoreTypes.redis.newClient(REDIS_URL);

Server(app, {
  connector,
  hostSecret,
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
}, store);

connector.startApp(app);
