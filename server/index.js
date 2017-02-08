import Hull from "hull";
import bodyParser from "body-parser";

import WebApp from "hull-ship-base/lib/app/web";
import InstrumentationAgent from "hull-ship-base/lib/instrumentation";
import { tokenMiddleware } from "hull-ship-base/lib/ship";

import { fetchEvents } from "./actions";
import WebOauthRouter from "./router/web-oauth-router";

const instrumentationAgent = new InstrumentationAgent();
const port = process.env.PORT || 8092;
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const hostSecret = (process.env.SECRET || "1234");

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const hullMiddleware = Hull.Middleware({ hostSecret, cacheShip: false });
const middlewareSet = [tokenMiddleware, hullMiddleware];

const app = WebApp({
  Hull, instrumentationAgent
});

app.use("/", WebOauthRouter({
  Hull,
  hostSecret,
  clientID,
  clientSecret,
  hullMiddleware
}));

app.post("/stripe", bodyParser.json(), ...middlewareSet, fetchEvents);

app.listenHull(port);
