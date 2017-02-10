import Hull from "hull";
import InstrumentationAgent from "hull-ship-base/lib/instrumentation";


export const instrumentationAgent = new InstrumentationAgent();
export const port = process.env.PORT || 8092;
export const clientID = process.env.CLIENT_ID;
export const clientSecret = process.env.CLIENT_SECRET;
export const hostSecret = (process.env.SECRET || "1234");
export const hullMiddleware = Hull.Middleware({ hostSecret, cacheShip: false });
export Hull from "hull";
