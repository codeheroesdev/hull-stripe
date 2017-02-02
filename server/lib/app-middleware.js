import HullAgent from "../util/hull-agent";
import JsonClient from "./json-client";
import InstrumentationAgent from "../util/instrumentation-agent";
import SyncAgent from "./sync-agent";

/**
 * [appMiddleware description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
export default function appMiddleware(req, res, next) {
  if (req.hull) {
    const instrumentationAgent = new InstrumentationAgent();
    const jsonClient = new JsonClient(req.hull, instrumentationAgent);
    const hullAgent = new HullAgent(req);
    const syncAgent = new SyncAgent(req, hullAgent);

    req.shipApp = req.shipApp || {
      instrumentationAgent,
      jsonClient,
      hullAgent,
      syncAgent,
      hullClient: req.hull.client
    };
  }
  return next();
}
