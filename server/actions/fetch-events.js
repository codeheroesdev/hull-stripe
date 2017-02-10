import Promise from "bluebird";
import util from "util";

import getEventContext from "../lib/get-event-context";
import getEventName from "../lib/get-event-name";
import getEventProperties from "../lib/get-event-properties";
import getUserIdent from "../lib/get-user-ident";

const stripe = require("stripe")(process.env.CLIENT_SECRET);

export default function fetchEvents(req, res) {
  const hullClient = req.hull.client;
  const event = req.body;
  const name = getEventName(event);
  hullClient.logger.debug("incoming.event", util.inspect(event, { depth: 4 }));

  if (name === null) {
    return res.sendStatus(204);
  }

  req.hull.metric.inc("ship.incoming.events");

  return Promise.all([
    stripe.customers.retrieve(event.data.object.customer),
    stripe.events.retrieve(event.id)
  ]).spread((customer, verifiedEvent) => {
    const properties = getEventProperties(verifiedEvent);
    const context = getEventContext(verifiedEvent);
    const user = getUserIdent(customer);
    return hullClient.as(user).track(name, properties, context);
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(err => {
    hullClient.logger.err("fetchEvents.error", err);
    return res.sendStatus(500);
  });
}
