import _ from "lodash";

const map = {
  "charge.succeeded": "Charge succeeded",
  "charge.refunded": "Charge Refunded",
  "customer.subscription.updated": "Subscription updated",
  "customer.subscription.created": "Subscription created",
  "customer.subscription.deleted": "Subscription ended"
};

export default function getEventName(event) {
  return _.get(map, event.type, null);
}
