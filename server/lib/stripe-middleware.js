/*
  Ensures we have a req.hull.token in the right place
  Uses reverse-mapping to find it from the redis store.
*/

export default function stripeMiddlewareFactory({ Hull, store, crypto }) {
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
          Hull.logger.error("stripeMiddleware.notFound", `Could not find a user for ${event.user_id}`);
          return res.send(200);
        }
        req.hull = req.hull || {};
        req.hull.token = token;
        return next();
      },
      (err) => {
        Hull.logger.error("stripeMiddleware.error", err);
        res.sendStatus(500);
      }
    );
  };
}
