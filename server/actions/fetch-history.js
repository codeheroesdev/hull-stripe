import _ from "lodash";
import Promise from "bluebird";
import Stripe from "stripe";
import getUserIdent from "../lib/get-user-ident";
import getEventName from "../lib/get-event-name";
import storeEvent from "../lib/store-event";
import storeUser from "../lib/store-user";

function fetchEventPage({ customers, hull, stripe, cursor }) {
  const list = {
    limit: 100,
    types: [
      "charge.succeeded",
      "charge.refunded",
      "customer.subscription.updated",
      "customer.subscription.created",
      "customer.subscription.deleted"
    ]
  };
  if (cursor) list.starting_after = cursor;

  return Promise.fromCallback(cb => stripe.events.list(list, cb))
  .then(({ has_more, data }) => {
    hull.logger.info("fetchEventPage.page", { has_more, cursor });
    const eventIds = _.map(data, (event) => {
      const name = getEventName(event);
      const customer = customers[event.data.object.customer];
      if (!customer) return null;
      const user = getUserIdent(customer);
      const eventId = event.id;

      storeEvent({ user, event, name, hull });
      cursor = eventId;
      return eventId;
    });

    if (!has_more) return eventIds;
    return [...eventIds, fetchEventPage({ customers, hull, stripe, cursor })];
  });
}

function fetchUserPage({ hull, stripe, cursor }) {
  const list = { limit: 100 };
  if (cursor) list.starting_after = cursor;

  return Promise.fromCallback(cb => stripe.customers.list(list, cb))
  .then(({ has_more, data }) => {
    hull.logger.info("fetchUserPage.page", { has_more, cursor });
    const customerIds = _.map(data, (customer) => {
      const user = getUserIdent(customer);
      storeUser({ user, customer, hull });
      const customerId = customer.id;
      cursor = customerId;
      return _.pick(customer, "id", "email");
    });

    if (!has_more) return customerIds;
    return [...customerIds, fetchUserPage({ hull, stripe, cursor })];
  });
}

export default function fetchHistory({ clientSecret, hull }) {
  hull.logger.info("fetchHistory.start");
  const stripe = Stripe(clientSecret);

  return fetchUserPage({ hull, stripe })
  .then(customers => _.reduce(customers, (m, v) => {
    m[v.id] = v;
    return m;
  }, {}))
  .then(customers => fetchEventPage({ hull, stripe, customers }))
  .then(
    (response) => {
      hull.logger.info("fetchHistory.success", response);
      return response;
    },
    (err) => {
      console.log(err);
      hull.logger.error("fetchHistory.error", err);
      return err;
    }
  );
}
