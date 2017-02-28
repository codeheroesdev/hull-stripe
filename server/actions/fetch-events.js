import Promise from "bluebird";
import util from "util";
import stripe from "stripe";

import getUserIdent from "../lib/get-user-ident";
import getEventName from "../lib/get-event-name";
import storeEvent from "../lib/store-event";
import storeUser from "../lib/store-user";

export default function fetchEventFactory({ clientSecret }) {
  const stripeClient = stripe(clientSecret);
  return function fetchEvents(req, res) {
    const event = req.body;
    const name = getEventName(event);
    const { client, metric } = req.hull;

    client.logger.debug("fetchEvents.incoming", util.inspect(event, { depth: 4 }));

    metric.increment("ship.incoming.events");
    return Promise.all([
      stripeClient.customers.retrieve(event.data.object.customer),
      stripeClient.events.retrieve(event.id)
    ]).spread((customer, verifiedEvent) => {
      const user = getUserIdent(customer);
      storeEvent({ user, event: verifiedEvent, name, hull: client });
      storeUser({ user, customer, hull: client });
      return true;
    })
    .then(
      () => res.sendStatus(200),
      (err) => {
        client.logger.error("fetchEvents.error", err);
        return res.sendStatus(500);
      }
    );
  };
}

