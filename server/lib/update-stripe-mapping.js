export default function (store, { token, ship }, messages) {
  const { private_settings = {} } = ship;
  const { stripe_user_id } = private_settings;

  if (!stripe_user_id) return;
  // Store the token mapped to the user_id we found.
  return store.set(stripe_user_id, token);
}
