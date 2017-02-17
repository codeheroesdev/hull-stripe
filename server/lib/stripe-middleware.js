/*
  Ensures we have a req.hull.token in the right place
  Uses reverse-mapping to find it from the redis store.
*/

export default function stripeMiddlewareFactory({ Hull, store }) {
  return function stripeMiddleware(req, res, next) {
    const event = req.body;
    if (!event) return res.sendStatus(400);
    return store
    .get(event.user_id)
    .then(
      (token) => {
        req.hull = req.hull || {};
        req.hull.token = token;
        next();
      },
      (err) => {
        Hull.logger.error("stripeMiddleware.error", err);
        res.sendStatus(400);
      }
    );
  };
}
