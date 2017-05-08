/* @flow */
const charge = {
  id: "charge_id?",
  invoice: "invoice_id?",
  order: "order_id?",
  amount: "amount?",
  currency: "currency?",
  description: "description?",
  failure_code: "failure_code?",
  failure_message: "failure_message?",
  paid: "paid?",
  receipt_email: "receipt_email?",
  receipt_number: "receipt_number?",
  refunded: "refunded?",
  status: "status?",
  amount_refunded: "amount_refunded" // ignored if null
};

export default charge;
