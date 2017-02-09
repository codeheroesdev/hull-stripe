export default function getUserIdent(customer) {
  return {
    email: customer.email,
    anonymous_id: `stripe:${customer.id}`
  };
}
