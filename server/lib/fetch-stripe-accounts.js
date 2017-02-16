import Stripe from "stripe";

export default function fetchStripeAccounts(clientSecret) {
  const stripe = Stripe(clientSecret);
  return new Promise((resolve, reject) => {
    stripe.accounts.list({ limit: 100 }, (err, accounts) => {
      if (err) return reject(err);
      return resolve(accounts.data);
    });
  });
}
