/* @flow */
import _ from "lodash";

/**
 * Builds an argument for `hull.as()` method.
 *
 * @param  {Object} ctx      Context object
 * @param  {Object} customer [description]
 * @return {mixed} object { external_id, anonymous_id } or { email, anonymous_id } or "id"
 */
export default function getUserIdent(ctx: any, customer: any) {
  const matchingParam = _.get(ctx, "ship.private_settings.metadata_id_parameter");
  const idName = _.get(ctx, "ship.private_settings.id_parameter");

  const ident = {
    anonymous_id: `stripe:${customer.id}`,
    email: {}
  };

  if (_.get(customer.metadata, matchingParam)) {
    if (idName === "id") {
      return _.get(customer.metadata, matchingParam);
    }
    ident[idName] = _.get(customer.metadata, matchingParam);
  } else {
    ident.email = customer.email;
  }
  return ident;
}
