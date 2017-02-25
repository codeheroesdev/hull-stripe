export default function getUserAttributes(customer) {
  return {
    ..._.pick(customer, [
      "id",
      "account_balance",
      "currency",
      "delinquent",
      "description",
      "email",
      "discount"
    ])
    created_at: customer.created;
  }
}
