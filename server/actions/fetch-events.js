/* @flow */
import Promise from "bluebird";
import util from "util";
import stripe from "stripe";
import { Request, Response } from "express";

import getUserIdent from "../lib/get-user-ident";
import getEventName from "../lib/get-event-name";
import storeEvent from "../lib/store-event";
import storeUser from "../lib/store-user";

export default function fetchEvents(req: Request, res: Response) {
  const event = req.body;
  const name = getEventName(event);
  const { client, metric, ship } = req.hull;

  const stripeClient = stripe(ship.private_settings.token);

  client.logger.debug("fetchEvents.incoming", util.inspect(event, { depth: 4 }));

  if (!event.data.object.customer) {
    return res.sendStatus(204);
  }

  metric.increment("ship.incoming.events");
  return Promise.all([
    stripeClient.customers.retrieve(event.data.object.customer),
    stripeClient.events.retrieve(event.id)
  ]).spread((customer, verifiedEvent) => {
    const user = getUserIdent(req.hull, customer);
    return Promise.all([
      storeEvent({ user, event: verifiedEvent, name, client }),
      storeUser({ user, customer, client })
    ]);
  })
  .then(
    () => res.sendStatus(200),
    (err) => {
      client.logger.error("fetchEvents.error", err.stack || err);
      return res.sendStatus(500);
    }
  ).catch((err) => {
    console.log(err);
  });
}

