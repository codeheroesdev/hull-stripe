/**
 * Created by noope on 03/02/2017.
 */
import { Router } from "express";
import { Strategy as StripeStrategy } from "passport-stripe";
import moment from "moment";
import OAuthHandler from "../oauth-handler";

export default function (deps) {
  const router = Router();
  const {
    Hull,
    hostSecret,
    clientID,
    clientSecret,
    shipCache,
    hullMiddleware
  } = deps;


  router.use("/auth", OAuthHandler(Hull ,{
    hostSecret,
    shipCache,
    name: "Stripe",
    Strategy: StripeStrategy,
    options: {
      clientID,
      clientSecret,
      scope: ["read_only"],
      skipUserProfile: true
    },
    hullMiddleware,
    isSetup(req, { hull, ship }) {
      if (req.query.reset) return Promise.reject();
      const { token } = ship.private_settings || {};

      if (token) {
         return hull.get(ship.id).then(s => {
          return { settings: s.private_settings };
        });
      }
      return Promise.reject();
    },
    onLogin: (req, { hull, ship }) => {
      req.authParams = { ...req.body, ...req.query };
      const newShip = {
        private_settings: {
          ...ship.private_settings,
          portal_id: req.authParams.portalId
        }
      };
      return hull.put(ship.id, newShip)
        .then(() => {
          shipCache.setClient(req.hull.client);
          return shipCache.del(ship.id);
        });
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
      return hull.put(ship.id, newShip)
        .then(() => {
          shipCache.setClient(req.hull.client);
          return shipCache.del(ship.id);
        });
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
