import ps from "promise-streams";
import BatchStream from "batch-stream";

/**
 *
 */
export default class SyncAgent {

  constructor(req, hullAgent) {
    this.hullClient = req.hull.client;
    this.hullAgent = hullAgent;
  }

  batchStream(jsonStream, chunkSize, callback) {
    return jsonStream.pipe(new BatchStream({ size: chunkSize }))
      .pipe(ps.map((ops) => {
        try {
          return callback(ops);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      }))
      .wait();
  }
}
