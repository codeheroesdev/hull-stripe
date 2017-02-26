import { Router } from "express";
import { Strategy as StripeStrategy } from "passport-stripe";
import Promise from "bluebird";
import _ from "lodash";
import moment from "moment";
import Stripe from "stripe";
import fetchEventHistory from "../actions/fetch-history";

export default function ({
  crypto,
  store,
  Hull,
  hostSecret,
  clientID,
  clientSecret,
  shipCache,
  instrumentationAgent
}) {
  const router = Router();

  const { OAuthHandler } = Hull;
  const { decrypt } = crypto;

  router.use("/auth", OAuthHandler({
    hostSecret,
    tokenInUrl: false,
    shipCache,
    name: "Stripe",
    Strategy: StripeStrategy,
    options: {
      clientID,
      clientSecret,
      scope: ["read_only"],
      stripe_landing: "login"
    },
    isSetup(req, { hull, ship }) {
      if (req.query.reset) return Promise.reject();
      const { private_settings = {} } = ship;
      const { token, stripe_user_id } = private_settings;

      let uid;
      try {
        uid = decrypt(stripe_user_id);
      } catch (e) {
        return Promise.reject({ message: "Couldn't decrypt Stripe User ID" });
      }

      // Early Return
      if (!token || !uid) {
        return Promise.reject({ message: "No token or UID" });
      }

      return hull.get(ship.id).then((s) => {
        const now = parseInt(new Date().getTime() / 1000, 0);
        const then = now - 3600; // one hour ago
        const query = `ship.incoming.events{ship:${ship.id}}`;

        let metric;
        if (process.env.DATADOG_API_KEY && process.env.DATADOG_APP_KEY) {
          instrumentationAgent.dogapi.initialize({
            api_key: process.env.DATADOG_API_KEY,
            app_key: process.env.DATADOG_APP_KEY
          });
          metric = Promise
          .fromCallback(cb => instrumentationAgent.dogapi.metric.query(then, now, query, cb));
        } else {
          metric = Promise.resolve();
        }
        const cache = store.set(stripe_user_id, req.hull.token);


        const account = Promise
        .fromCallback(cb => Stripe(clientSecret).account.retrieve(uid, cb));

        return Promise
        .all([metric, account, cache])
        .then(([events = {}, accnt = {}]) => {
          const { business_name = "", business_logo = "" } = accnt;
          return {
            error: null,
            business_name,
            business_logo,
            settings: s.private_settings,
            hostname: req.hostname,
            token: req.hull.token,
            events: _.get(events, "series[0].pointlist", []).map(p => p[1])
          };
        });
      }).catch((err) => {
        hull.logger.error("isSetup.error", err);
        return {
          error: err.message
        };
      });
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
          // Store it in an encrypted form so we're not vulnerable to identity theft
          stripe_user_id: crypto.encrypt(stripe_user_id),
          stripe_publishable_key,
          token_fetched_at: moment().utc().format("x"),
        }
      };

      return Promise.all([
        fetchEventHistory({ clientSecret, hull }),
        hull.put(ship.id, newShip)
      ]);
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
