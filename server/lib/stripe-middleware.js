/*
  Ensures we have a req.hull.token in the right place
  Uses reverse-mapping to find it from the redis store.
*/

import Redis from "ioredis";
import Crypt from "../lib/crypt";

export default function stripeMiddlewareFactory(store: Redis, crypto: Crypt) {
  return function stripeMiddleware(req, res, next) {
    const event = req.body;
    if (!event) return res.sendStatus(400);

    // Prevent impersonation & identity theft
    // You only can build this encrypted version of the UID coming back from oAuth.

    const uid = crypto.encrypt(event.user_id);

    return store
    .get(uid)
    .then(
      (token) => {
        if (!token) {
          req.hull.client.logger.error("stripeMiddleware.notFound", `Could not find a user for ${event.user_id}`);
          return res.sendStatus(200);
        }
        req.hull = req.hull || {};
        req.hull.token = token;
        req.hull.config = null;
        return next();
      },
      (err) => {
        req.hull.client.logger.error("stripeMiddleware.error", err);
        res.sendStatus(500);
      }
    );
  };
}
