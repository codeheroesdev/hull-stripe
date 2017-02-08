import _ from "lodash";

export default function eventMapper(event) {
  const properties = {};
  const traits = {};

  var revenue;

  if (event.data.object.object === 'subscription') {
    _.extend(properties, event.data.object.plan, _.pick(event.data.object, 'id', 'created', 'status', 'discount', 'cancel_at_period_end'), {
      subscriptionId: event.data.object.object
    });
    if (event.type === 'customer.subscription.created') {
      revenue = event.data.object.plan.amount / 100;
    } else if (event.type === 'customer.subscription.deleted') {
      revenue = 0;
    }
    _.extend(traits, {
      isPaid: event.type === 'customer.subscription.created',
      revenue: revenue,
      planInterval: event.data.object.plan.interval
    });
  } else if (event.data.object.object === 'charge') {
    revenue = event.data.object.amount / 100;
    _.extend(properties, _.pick(event.data.object, 'id', 'created', 'status', 'amount', 'currency'), {
      revenue: revenue,
      chargeId: event.data.object.object
    });
    _.extend(traits, {
      isPaid: true,
      revenue: revenue
    });
  }

  return { traits, properties };
}
