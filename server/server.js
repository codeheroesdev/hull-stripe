import InstrumentationAgent from "hull-ship-base/lib/instrumentation";
import WebApp from "hull-ship-base/lib/app/web";
import bodyParser from "body-parser";
import Redis from "ioredis";
import { fetchEvents } from "./actions";
import WebOauthRouter from "./router/web-oauth-router";
import StripeMiddleware from "./lib/stripe-middleware";
import updateStripeMapping from "./lib/update-stripe-mapping";
// import fetchStripeAccounts from "./lib/fetch-stripe-accounts";

module.exports = function Server({ port, redisUrl, clientSecret, clientID, hostSecret, Hull }) {
  const { Middleware, NotifHandler } = Hull;
  const hullMiddleware = Middleware({ hostSecret, cacheShip: false });

  // This should be abstracted since anyway's it's using datadog specifics downstream
  const instrumentationAgent = new InstrumentationAgent();

  // Wrapped express() call.
  const app = WebApp({ Hull, instrumentationAgent });

  // Redis Store
  const store = new Redis(redisUrl);

  app.use("/", WebOauthRouter({
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
    onError: (message, status) => console.warn("Error", status, message),
    handlers: {
      "user:update": updateStripeMapping.bind(this, store),
      "ship:update": updateStripeMapping.bind(this, store),
      "segment:update": updateStripeMapping.bind(this, store)
    }
  }));

  // // Fetch all accounts and store the reverse mapping;
  // fetchStripeAccounts(clientSecret)
  // .then(accounts => { console.log(accounts) }, err => console.log(err));

  app.use("/stripe",
    bodyParser.json(),
    StripeMiddleware({ store, clientSecret }),
    hullMiddleware,
    fetchEvents
  );
  app.listen(port, () => Hull.logger.info("webApp.listen", port));

  return app;
};
