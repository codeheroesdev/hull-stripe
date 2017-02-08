import Promise from "bluebird";
import _ from 'lodash';

import eventMapper from "../lib/event-mapper";
import customerMapper from "../lib/customer-mapper";


const STRIPE_EVENT_NAMES = {
  "charge.succeeded": "Stripe charge succeeded",
  "customer.subscription.created": "Stripe subscription started",
  "customer.subscription.deleted": "Stripe subscription ended"
}

const stripe = require("stripe")(process.env.CLIENT_SECRET);


export default function fetchEvents(req, res) {
  const event = req.body;
  console.log("incoming.event", event);

  if (!_.has(STRIPE_EVENT_NAMES, event.type)) {
    return res.sendStatus(204);
  }

  stripe.events.retrieve(event.id)
    .then(verifiedEvent => {
      const customerId = verifiedEvent.data.object.customer;
      return stripe.customers.retrieve(customerId)
        .then(customer => {
          return { customer, event: verifiedEvent };
        });
    })
    .then(({ customer, event }) => {
      const { traits, properties } = eventMapper(event);
      const user = customerMapper(customer)
      console.log({ user, traits, properties });
      res.sendStatus(200);
    });
}
