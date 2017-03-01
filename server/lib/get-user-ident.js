import _ from "lodash";

export default function getUserIdent(ctx, customer) {
  const matchingParam = _.get(ctx, "ship.private_settings.metadata_external_id_parameter");

  const ident = {
    anonymous_id: `stripe:${customer.id}`
  };

  if (_.get(customer.metadata, matchingParam)) {
    _.merge(ident, {
      external_id: _.get(customer.metadata, matchingParam)
    });
  } else {
    _.merge(ident, {
      email: customer.email
    });
  }
  console.log("IDENT", ident);
  return ident;
}
