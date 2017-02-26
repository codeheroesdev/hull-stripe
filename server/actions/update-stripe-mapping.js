export default function (store, { message = {} }, { req, ship = {} }) {
  const { private_settings = {} } = ship;
  const { user_id } = private_settings;
  if (!user_id) return;
  // Store the token mapped to the user_id we found.
  store.set(user_id, req.hull.token);
}
