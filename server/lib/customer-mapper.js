import _ from "lodash";

export default function customerMapper(customer) {
  return {
    email: customer.email,
    anonymous_id: `stripe:${customer.id}`
  };
}
