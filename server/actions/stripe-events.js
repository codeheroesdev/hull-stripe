/**
 * Created by noope on 03/02/2017.
 */
import Promise from "bluebird";
import _ from 'lodash';


const STRIPE_EVENT_NAMES = {
  "charge.succeeded": "Charge succeeded",
  "charge.failed": "Charge failed",
  "charge.refunded": "Charge refunded",
  "charge.updated": "Charge updated",
  "charge.dispute.created": "Charge dispute created",
  "charge.dispute.closed": "Charge dispute closed",
  "charge.dispute.updated": "Charge dispute updated",
  "customer.discount.created": "Discount created",
  "customer.discount.deleted": "Discount deleted",
  "customer.discount.updated": "Discount updated",
  "customer.source.created": "Payment source created",
  "customer.source.deleted": "Payment source deleted",
  "customer.source.updated": "Payment source updated",
  "customer.subscription.created": "Subscription created",
  "customer.subscription.deleted": "Subscription deleted",
  "customer.subscription.trial_will_end": "Subscription trial will end",
  "customer.subscription.updated": "Subscription updated",
}

const stripe = require("stripe")(
  "sk_test_LWK49LLcu3U0Us0cI4D1xOSB"
);


export default function stripeEvents(req, res) {
  try {
    const event = req.body;
    const eventData = req.body.data.object;


    var syncObject = {};

    switch (eventData.object) {
      case "charge":
        syncObject["charge_id"] = eventData.id;
        syncObject["amount"] = eventData.amount;
        syncObject["currency"] = eventData.currency;
        syncObject["description"] = eventData.description;
        syncObject["failure_code"] = eventData.failure_code;
        syncObject["failure_message"] = eventData.failure_message;
        syncObject["invoice_id"] = eventData.invoice;
        syncObject["order_id"] = eventData.order;
        syncObject["paid"] = eventData.paid;
        syncObject["receipt_email"] = eventData.receipt_email;
        syncObject["receipt_number"] = eventData.receipt_number;
        syncObject["refunded"] = eventData.refunded;
        syncObject["status"] = eventData.status;
        break;
      case "dispute":
        syncObject["charge_id"] = eventData.id;
        syncObject["dispute_id"] = eventData.amount;
        syncObject["currency"] = eventData.currency;
        syncObject["reason"] = eventData.reason;
        syncObject["status"] = eventData.status;
        syncObject["is_charge_refundable"] = eventData.is_charge_refundable;
        break;
      case "discount":
        syncObject["coupon_id"] = eventData.coupon.id;
        syncObject["amount_off"] = eventData.coupon.amount_off;
        syncObject["duration"] = eventData.coupon.duration;
        syncObject["duration_in_months"] = eventData.coupon.duration_in_months;
        syncObject["discount_start"] = eventData.start;
        syncObject["discount_end"] = eventData.end;
        break;
      case "card":
        syncObject["source_id"] = eventData.id;
        syncObject["type "] = eventData.object;
        syncObject["address_city"] = eventData.address_city;
        syncObject["address_country"] = eventData.address_country;
        syncObject["address_line1"] = eventData.address_line1;
        syncObject["address_line1_check"] = eventData.address_line1_check;
        syncObject["address_line2"] = eventData.address_line2;
        syncObject["address_state"] = eventData.address_state;
        syncObject["address_zip"] = eventData.address_zip;
        syncObject["address_zip_check"] = eventData.address_zip_check;
        syncObject["brand"] = eventData.brand;
        syncObject["country"] = eventData.country;
        syncObject["last4"] = eventData.last4;
        syncObject["dynamic_last4"] = eventData.dynamic_last4;
        syncObject["funding"] = eventData.funding;
        break;
      case "subscription":
        syncObject["application_fee_percent"] = eventData.application_fee_percent;
        syncObject["cancel_at_period_end"] = eventData.cancel_at_period_end;
        syncObject["canceled_at"] = eventData.canceled_at;
        syncObject["current_period_end_at"] = eventData.current_period_end;
        syncObject["current_period_start_at"] = eventData.current_period_start;
        syncObject["discount"] = eventData.discount;
        syncObject["ended_at"] = eventData.ended_at;
        syncObject["ended_at"] = eventData.ended_at;
        syncObject["item_names"] = _.filter(_.map(eventData.items.data, i => _.get(i, "plan.name")), (v) => {
          return v !== undefined
        });
        syncObject["plan_id"] = eventData.plan.id;
        syncObject["plan_name"] = eventData.plan.name;
        syncObject["amount"] = eventData.plan.amount;
        syncObject["currency"] = eventData.currency;
        syncObject["interval"] = eventData.interval;
        syncObject["interval_count"] = eventData.plan.interval_count;
        syncObject["status"] = eventData.status;
        syncObject["tax_percent"] = eventData.tax_percent;
        syncObject["trial_end_at"] = eventData.trial_end_at;
        syncObject["trial_start_at"] = eventData.trial_start_at;
        break;
    }

    if (eventData.hasOwnProperty("metadata"))
      if (eventData.metadata !== null) {
        for (var meta in eventData.metadata) {
          syncObject["metadata_" + meta] = eventData.metadata[meta];
        }
      }

    var userEmail = null;

    if (eventData.hasOwnProperty("receipt_email")) {
      userEmail = eventData.receipt_email;
    }else{
      if(eventData.customer === null || !undefined) return res.send(400);
    }

    if (userEmail !== null) {
      const client = req.hull.client.as({
        email: eventData.receipt_email || "",
        anonymous_id: `stripe:${eventData.customer}`
      });

      client.track(STRIPE_EVENT_NAMES[event.type],
        syncObject, {
          source: "stripe",
          type: "payment",
          created_at: new Date(event.created).toISOString(),
          event_id: `stripe-${event.id}`
        }
      );
      return res.send(200);
    } else if (userEmail === null && eventData.customer !== null) {
      stripe.customers.retrieve(
        eventData.customer,
        function (err, customer) {

          console.log(err);
          console.log(customer);

          const client = req.hull.client.as({
            email: customer.email || "",
            anonymous_id: `stripe:${customer.id}`
          });

          client.track(STRIPE_EVENT_NAMES[event.type],
            syncObject, {
              source: "stripe",
              type: "payment",
              created_at: new Date(event.created).toISOString(),
              event_id: `stripe-${event.id}`
            }
          );
          return res.send(200);
        }
      );
    } else {
      return res.send(400);
    }
  } catch (err) {
    console.log(err);
    return res.send(400);
  }


}
