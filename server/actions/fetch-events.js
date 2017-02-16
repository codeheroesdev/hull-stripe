import Promise from "bluebird";
import util from "util";
import stripe from "stripe";

import getEventContext from "../lib/get-event-context";
import getEventName from "../lib/get-event-name";
import getEventProperties from "../lib/get-event-properties";
import getUserIdent from "../lib/get-user-ident";

export default function fetchEventFactory(clientSecret) {
  return function fetchEvents(req, res) {
    const event = req.body;
    const name = getEventName(event);
    const stripeClient = stripe(clientSecret);
    const { client } = req.hull;

    client.logger.debug("incoming.event", util.inspect(event, { depth: 4 }));

    if (name === null) return res.sendStatus(400);

    // probably need to move `metric` into client: `client.metric.inc`
    client.metric.inc("ship.incoming.events");

    return Promise.all([
      stripeClient.customers.retrieve(event.data.object.customer),
      stripeClient.events.retrieve(event.id)
    ]).spread((customer, verifiedEvent) => {
      const properties = getEventProperties(verifiedEvent);
      const context = getEventContext(verifiedEvent);
      const user = getUserIdent(customer);
      return client.as(user).track(name, properties, context);
    })
    .then(
      () => res.sendStatus(200),
      (err) => {
        client.logger.error("fetchEvents.error", err);
        return res.sendStatus(404);
      }
    );
  };
}

