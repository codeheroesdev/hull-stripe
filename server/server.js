import InstrumentationAgent from "hull-ship-base/src/instrumentation";
import WebApp from "hull-ship-base/src/app/web";
import { actionRouter } from "hull-ship-base/src/ship";
import { fetchEvents } from "./actions";
import WebOauthRouter from "./router/web-oauth-router";

module.exports = function Server({ port, clientSecret, clientID, hostSecret, Hull }) {
  const { Middleware } = Hull;
  const hullMiddleware = Middleware({ hostSecret, cacheShip: false });

  // This should be abstracted since anyway's it's using datadog specifics downstream
  const instrumentationAgent = new InstrumentationAgent();

  // Wrapped express() call.
  const app = WebApp({ Hull, instrumentationAgent });

  app.use("/", WebOauthRouter({
    Hull,
    hostSecret,
    clientID,
    clientSecret,
    hullMiddleware,
    instrumentationAgent
  }));

  app.use("/stripe", actionRouter({ hullMiddleware }).action(fetchEvents));

  app.listen(port, () => Hull.logger.info("webApp.listen", port));
  return app;
};
