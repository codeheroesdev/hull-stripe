import { Router } from "express";
import { Strategy as StripeStrategy } from "passport-stripe";
import moment from "moment";
import OAuthHandler from "../oauth-handler";
import Promise from "bluebird";
import _ from "lodash";

export default function (deps) {
  const router = Router();
  const {
    Hull,
    hostSecret,
    clientID,
    clientSecret,
    shipCache,
    hullMiddleware,
    instrumentationAgent
  } = deps;


  router.use("/auth", OAuthHandler(Hull, {
    hostSecret,
    shipCache,
    name: "Stripe",
    Strategy: StripeStrategy,
    options: {
      clientID,
      clientSecret,
      scope: ["read_only"],
      stripe_landing: "login"
    },
    hullMiddleware,
    isSetup(req, { hull, ship }) {
      if (req.query.reset) return Promise.reject();
      const { token } = ship.private_settings || {};

      if (token) {
        return hull.get(ship.id).then(s => {
          const now = parseInt(new Date().getTime() / 1000);
          const then = now - 3600; // one hour ago
          const query = `ship.incoming.events{ship:${ship.id}}`;
          instrumentationAgent.dogapi.initialize({
            api_key: process.env.DATADOG_API_KEY,
            app_key: process.env.DATADOG_APP_KEY
          });
          return Promise.fromCallback((cb) => instrumentationAgent.dogapi.metric.query(then, now, query, cb))
          .then(res => {
            const events = _.get(res, "series[0].pointlist", []).map(p => p[1]);
            return { settings: s.private_settings,
              token: req.hull.token,
              hostname: req.hostname,
              events
            };
          });
        });
      }
      return Promise.reject();
    },
    onLogin: (req, { hull, ship }) => {
      req.authParams = { ...req.body, ...req.query };
      return Promise.resolve();
    },
    onAuthorize: (req, { hull, ship }) => {
      const { refreshToken, accessToken } = (req.account || {});
      const newShip = {
        private_settings: {
          ...ship.private_settings,
          refresh_token: refreshToken,
          token: accessToken,
          token_fetched_at: moment().utc().format("x"),
        }
      };
      return hull.put(ship.id, newShip);
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    },
  }));

  return router;
}
