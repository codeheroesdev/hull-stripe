import _ from "lodash";

import getUserIdent from "../lib/get-user-ident";
import getEventName from "../lib/get-event-name";
import storeEvent from "../lib/store-event";
import storeUser from "../lib/store-user";

function fetchEventPage(ctx, { customers, cursor }) {
  const { client, stripe } = ctx;
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

  return stripe.events.list(list)
  .then(({ has_more, data }) => {
    client.logger.info("fetchEventPage.page", { has_more, cursor });
    const eventIds = _.map(data, (event) => {
      const name = getEventName(event);
      const customer = customers[event.data.object.customer];
      if (!customer) return null;
      const user = getUserIdent(ctx, customer);
      const eventId = event.id;

      storeEvent({ user, event, name, hull: client });
      cursor = eventId;
      return eventId;
    });

    if (!has_more) return eventIds;
    return [...eventIds, fetchEventPage(ctx, { customers, cursor })];
  });
}

function fetchUserPage(ctx, { cursor } = {}) {
  const { client, stripe } = ctx;
  const list = { limit: 100 };
  if (cursor) list.starting_after = cursor;

  return stripe.customers.list(list)
  .then(({ has_more, data }) => {
    client.logger.info("fetchUserPage.page", { has_more, cursor });
    const customerIds = _.map(data, (customer) => {
      const user = getUserIdent(ctx, customer);
      storeUser({ user, customer, hull: client });
      const customerId = customer.id;
      cursor = customerId;
      return _.pick(customer, "id", "email", "metadata");
    });

    if (!has_more) return customerIds;
    return [...customerIds, fetchUserPage(ctx, { cursor })];
  });
}

export default function fetchHistory(ctx) {
  const { client } = ctx;
  client.logger.info("fetchHistory.start");

  return fetchUserPage(ctx)
  .then(customers => _.reduce(customers, (m, v) => {
    m[v.id] = v;
    return m;
  }, {}))
  .then(customers => fetchEventPage(ctx, { customers }))
  .then(
    (response) => {
      client.logger.info("fetchHistory.success", response);
      return response;
    },
    (err) => {
      console.log(err);
      client.logger.error("fetchHistory.error", err);
      return err;
    }
  );
}
