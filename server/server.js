import { notifHandler } from "hull/lib/utils";

import Redis from "ioredis";
import { FetchEvents } from "./actions";
import webOauthRouter from "./router/web-oauth-router";
import StripeMiddleware from "./lib/stripe-middleware";
import updateStripeMapping from "./lib/update-stripe-mapping";

module.exports = function Server(app, { Hull, redisUrl, clientSecret, clientID }) {
  const server = app.server();

  // Redis Store
  const store = new Redis(redisUrl);

  server.use("/auth", webOauthRouter({
    store,
    clientID,
    clientSecret
  }));

  server.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: true,
    },
    handlers: {
      "user:update": updateStripeMapping.bind(this, store),
      "ship:update": updateStripeMapping.bind(this, store),
      "segment:update": updateStripeMapping.bind(this, store)
    }
  }));

  server.use("/stripe",
    StripeMiddleware({ Hull, clientSecret, store }),
    app.middleware(),
    FetchEvents({ clientSecret })
  );

  return app;
};
