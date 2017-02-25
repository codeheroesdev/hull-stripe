import _ from "lodash";
import flatten from "flat";

function mapSubscription(object) {
  return {
    subscription_id: object.id,
    plan_id: object.plan.id,
    ..._.pick(object, [
      "application_fee_percent",
      "cancel_at_period_end",
      "canceled_at",
      "current_period_end_at",
      "current_period_start_at",
      "discount",
      "ended_at",
      "status",
      "tax_percent"
    ]),
    items_count: object.items.total_count,
    plan_name: object.plan.name,
    amount: object.plan.amount,
    currency: object.plan.currency,
    interval: object.plan.interval,
    interval_count: object.plan.interval_count,
    trial_end_at: object.trial_end,
    trial_start_at: object.trial_start
  };
}

function mapCharge(object) {
  const properties = {
    charge_id: object.id,
    invoice_id: object.invoice,
    order_id: object.order,
    ..._.pick(object, [
      "amount",
      "currency",
      "description",
      "failure_code",
      "failure_message",
      "paid",
      "receipt_email",
      "receipt_number",
      "refunded",
      "status"
    ])
  };

  if (object.refunded) {
    properties.amount_refunded = object.amount_refunded;
  }

  return properties;
}

function addPreviousAttributes(properties, object) {
  if (object.previous_attributes) {
    _.map(object.previous_attributes, (v, k) => {
      properties[`previous_${k}`] = v;
    });
  }
  return properties;
}

const MAP = {
  subscription: mapSubscription,
  charge: mapCharge
};

export default function getEventProperties({ data }) {
  const { object } = data;

  const mapper = MAP(object.object);
  const properties = addPreviousAttributes(mapper(object) || {}, object);

  return {
    ...properties,
    ...flatten(_.pick(object, "metadata"), { delimiter: "_" })
  };
}
