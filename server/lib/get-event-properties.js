import _ from "lodash";
import flatten from "flat";

export default function getEventProperties(event) {
  const properties = {};

  if (event.data.object.object === "subscription") {
    _.extend(properties, {
      subscription_id: event.data.object.id,
      plan_id: event.data.object.plan.id,
    });

    _.extend(properties, _.pick(event.data.object, [
      "application_fee_percent", "cancel_at_period_end", "canceled_at", "current_period_end_at",
      "current_period_start_at", "discount", "ended_at", "status", "tax_percent"
    ]));

    _.extend(properties, {
      // item_names:
      items_count: event.data.object.items.total_count,
      plan_name: event.data.object.plan.name,
      amount: event.data.object.plan.amount,
      currency: event.data.object.plan.currency,
      interval: event.data.object.plan.interval,
      interval_count: event.data.object.plan.interval_count,
      trial_end_at: event.data.object.trial_end,
      trial_start_at: event.data.object.trial_start
    });
  } else if (event.data.object.object === "charge") {
    _.extend(properties, {
      charge_id: event.data.object.id,
      invoice_id: event.data.object.invoice,
      order_id: event.data.object.order,
    });

    _.extend(properties, _.pick(event.data.object, [
      "amount", "currency", "description", "failure_code", "failure_message",
      "paid", "receipt_email", "receipt_number", "refunded", "status",
    ]));
  }

  _.extend(properties, flatten(_.pick(event.data.object, "metadata"), { delimiter: "_" }));

  return properties;
}
