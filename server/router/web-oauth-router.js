import { Router } from "express";
import { Strategy as StripeStrategy } from "passport-stripe";
import Promise from "bluebird";
import _ from "lodash";
import moment from "moment";
import OAuthHandler from "../oauth-handler";
import Stripe from "stripe";

export default function ({
  store,
  Hull,
  hostSecret,
  clientID,
  clientSecret,
  shipCache,
  hullMiddleware,
  instrumentationAgent
}) {
  const router = Router();

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

      const { private_settings = {} } = ship;
      const { token, stripe_user_id } = private_settings;

      // Early Return
      if (!token || !stripe_user_id) return Promise.reject();

      return hull.get(ship.id).then((s) => {
        const now = parseInt(new Date().getTime() / 1000, 0);
        const then = now - 3600; // one hour ago
        const query = `ship.incoming.events{ship:${ship.id}}`;
        instrumentationAgent.dogapi.initialize({
          api_key: process.env.DATADOG_API_KEY,
          app_key: process.env.DATADOG_APP_KEY
        });
        const cache = store.set(stripe_user_id, req.hull.token);

        const metric = Promise
        .fromCallback(cb => instrumentationAgent.dogapi.metric.query(then, now, query, cb));

        const account = Promise
        .fromCallback(cb => Stripe(clientSecret).account.retrieve(stripe_user_id, cb));

        return Promise
        .all([metric, account, cache])
        .then(([events, accnt = {}]) => ({
          business_name: accnt.business_name,
          business_logo: accnt.business_logo,
          settings: s.private_settings,
          token: req.hull.token,
          hostname: req.hostname,
          events: _.get(events, "series[0].pointlist", []).map(p => p[1])
        }));
      }).catch(err => console.log(err));
    },
    onLogin: (req /* , { hull, ship } */) => {
      req.authParams = { ...req.body, ...req.query };
      return Promise.resolve();
    },
    onAuthorize: ({ account = {} }, { hull, ship = {} }) => {
      const { private_settings = {} } = ship;
      const { profile = {}, refreshToken, accessToken } = account;
      const { stripe_user_id, stripe_publishable_key } = profile;
      const newShip = {
        private_settings: {
          ...private_settings,
          refresh_token: refreshToken,
          token: accessToken,
          stripe_user_id,
          stripe_publishable_key,
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
