This connector captures Stripe charges and subscription and adds them to your customer profiles. We use the `email` field to reconcile transactions. For now it captures the following events:

- `charge.succeeded` as "Charge succeeded",
- `customer.subscription.created` as "Subscription created",
- `customer.subscription.deleted` as "Subscription ended",

For those events, we capture the following fields: 


#### _customer.subscription_

```js
// Stored field name: Original field name
{
  "application_fee_percent": "application_fee_percent",
  "cancel_at_period_end":    "cancel_at_period_end",
  "canceled_at":             "canceled_at",
  "current_period_end_at":   "current_period_end_at",
  "current_period_start_at": "current_period_start_at",
  "discount":                "discount",
  "ended_at":                "ended_at",
  "status":                  "status",
  "tax_percent":             "tax_percent",
  "subscription_id":         "object.id",

  "plan_id":                 "plan.id",
  "items_count":             "items.total_count",
  "plan_name":               "plan.name",
  "amount":                  "plan.amount",
  "currency":                "plan.currency",
  "interval":                "plan.interval",
  "interval_count":          "plan.interval_count",
  "trial_end_at":            "trial_end",
  "trial_start_at":          "trial_star"
}
```

#### _charge_

```js
// Stored field name: Original field name
{
  "amount":          "amount",
  "currency":        "currency",
  "description":     "description",
  "failure_code":    "failure_code",
  "failure_message": "failure_message",
  "paid":            "paid",
  "receipt_email":   "receipt_email",
  "receipt_number":  "receipt_number",
  "refunded":        "refunded",
  "status":          "status",

  "charge_id":       "object.id",
  "invoice_id":      "object.invoice",
  "order_id":        "object.order"
}
```
