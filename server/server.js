import { notifHandler } from "hull/lib/utils";

import Redis from "ioredis";
import { FetchEvents } from "./actions";
import webOauthRouter from "./router/web-oauth-router";
import StripeMiddleware from "./lib/stripe-middleware";
import updateStripeMapping from "./lib/update-stripe-mapping";

module.exports = function Server(app, { Hull, connector, redisUrl, clientSecret, clientID }) {

  // Redis Store
  const store = new Redis(redisUrl);

  app.use("/auth", webOauthRouter({
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

  app.use("/stripe",
    StripeMiddleware({ Hull, clientSecret, store }),
    connector.clientMiddleware(),
    FetchEvents({ clientSecret })
  );

  return app;
};
