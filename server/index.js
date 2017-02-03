import Hull from "hull";
import bodyParser from "body-parser";
// import cors from "cors";

import WebApp from "./util/app/web";
import StaticRouter from "./util/router/static";
import tokenMiddleware from "./util/middleware/token";
import appMiddleware from "./lib/app-middleware";
import {stripeEvents} from "./actions";

import CacheManager from "cache-manager";

import WebOauthRouter from "./router/web-oauth-router";

const port = process.env.PORT || 8092;
const clientID = "ca_A3A45Ag8tHeTp3hfTU8y2fHEbQCpKmTX";
const clientSecret = "sk_test_LWK49LLcu3U0Us0cI4D1xOSB"
const hostSecret = (process.env.SECRET || "1234");

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const cacheManager = CacheManager.caching({
  store: "memory",
  max: process.env.SHIP_CACHE_MAX || 100,
  ttl: process.env.SHIP_CACHE_TTL || 60
});

const shipCache = new Hull.ShipCache(cacheManager, process.env.SHIP_CACHE_PREFIX || "hull-stripe");

const hullMiddleware = Hull.Middleware({hostSecret, cacheShip: false});
const middlewareSet = [tokenMiddleware, hullMiddleware, appMiddleware];
const app = WebApp();

app.use("/", StaticRouter({Hull}))
  .use("/", WebOauthRouter({
    Hull,
    hostSecret,
    clientID,
    clientSecret,
    shipCache,
    hullMiddleware
  }));

//
app.post("/stripe", bodyParser.json(), ...middlewareSet, stripeEvents);


app.listen(port, () => {
  Hull.logger.info("webApp.listen", port);
});

