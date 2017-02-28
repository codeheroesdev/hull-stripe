import { notifHandler } from "hull/lib/utils";

import Redis from "ioredis";

import { fetchHistory, updateStripeMapping, fetchEvents } from "./actions";
import stripeMiddleware from "./lib/stripe-middleware";
import webOauthRouter from "./router/web-oauth-router";
import cryptFactory from "./lib/crypt";

module.exports = function Server(app, { Hull, connector, hostSecret, redisUrl, clientSecret, clientID }) {

  // Redis Store
  const store = new Redis(redisUrl);
  const crypto = cryptFactory({ hostSecret });

  app.use("/auth", webOauthRouter({
    crypto,
    store,
    clientID,
    clientSecret
  }));

  app.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: true,
      maxSize: 1,
      maxTime: 1
    },
    handlers: {
      "user:update": updateStripeMapping.bind(this, store),
      "ship:update": updateStripeMapping.bind(this, store),
      "segment:update": updateStripeMapping.bind(this, store)
    }
  }));

  app.post("/fetch-all", connector.clientMiddleware(), function fetchAllRes(req, res) {
    const { client } = req.hull;
    fetchHistory({ clientSecret, hull: client })
    .then(
      response => res.send({ ...response, status: "ok" }),
      err => res.send({ status: "error", ...err })
    );
  });

  app.use("/stripe",
    stripeMiddleware({ Hull, clientSecret, store, crypto }),
    connector.clientMiddleware(),
    fetchEvents({ Hull, clientSecret })
  );

  return app;
};
