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
