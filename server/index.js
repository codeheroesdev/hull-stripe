import { Hull, instrumentationAgent, hullMiddleware,
  clientID, clientSecret, hostSecret, port } from "./bootstrap";

import WebApp from "hull-ship-base/lib/app/web";
import { actionRouter } from "hull-ship-base/lib/ship";

import { fetchEvents } from "./actions";
import WebOauthRouter from "./router/web-oauth-router";


if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const app = WebApp({
  Hull, instrumentationAgent
});

app.use("/", WebOauthRouter({
  Hull,
  hostSecret,
  clientID,
  clientSecret,
  hullMiddleware,
  instrumentationAgent
}));

app.use("/stripe", actionRouter({ hullMiddleware }).action(fetchEvents));

app.listenHull(port);
