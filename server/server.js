import InstrumentationAgent from "hull-ship-base/lib/instrumentation";
import WebApp from "hull-ship-base/lib/app/web";
import bodyParser from "body-parser";
import Redis from "ioredis";
import { fetchHistory, updateStripeMapping, fetchEvents } from "./actions";
import stripeMiddleware from "./lib/stripe-middleware";
import webOauthRouter from "./router/web-oauth-router";
import cryptFactory from "./lib/crypt";

module.exports = function Server({ port, redisUrl, clientSecret, clientID, hostSecret, Hull }) {
  const { Middleware, NotifHandler } = Hull;
  const hullMiddleware = Middleware({ hostSecret, cacheShip: false });

  // This should be abstracted since anyway's it's using datadog specifics downstream
  const instrumentationAgent = new InstrumentationAgent();

  // Wrapped express() call.
  const app = WebApp({ Hull, instrumentationAgent });

  // Redis Store
  const store = new Redis(redisUrl);
  const crypto = cryptFactory({ hostSecret });

  app.use("/", webOauthRouter({
    crypto,
    store,
    Hull,
    hostSecret,
    clientID,
    clientSecret,
    hullMiddleware,
    instrumentationAgent
  }));

  app.post("/notify", NotifHandler({
    hostSecret,
    groupTraits: true,
    onError: (message, status) => Hull.logger.warn("NotifHandler.error", status, message),
    handlers: {
      "user:update": updateStripeMapping.bind(this, store),
      "ship:update": updateStripeMapping.bind(this, store),
      "segment:update": updateStripeMapping.bind(this, store)
    }
  }));

  app.post("/fetch-all", bodyParser.json(), hullMiddleware, function fetchAllRes(req, res) {
    const { client } = req.hull;
    fetchHistory({ clientSecret, hull: client })
    .then(
      response => res.send({ ...response, status: "ok" }),
      err => res.send({ status: "error", ...err })
    );
  });

  app.use("/stripe",
    bodyParser.json(),
    stripeMiddleware({ Hull, clientSecret, store, crypto }),
    hullMiddleware,
    fetchEvents({ Hull, clientSecret })
  );

  app.listen(port, () => Hull.logger.info("webApp.listen", port));

  return app;
};
