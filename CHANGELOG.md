## 0.1.0

- upgrade hull-node to beta
- adjusted `Hull.Connector` api
- fixed promises chains
- fixed events data variable
- added a `metadata_id_parameter` field to customize the user resolution. If the selected metadata param is set on particular customer, it will be used as a value of id which is chosen by `id_parameter` private setting
- changed all Stripe client initialization from `Stripe(clientSecret)` to `Stripe(accessToken)`, so the connector doesn't fetch data from outside the connected account scope
