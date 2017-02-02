import request from "superagent";
import JSONStream from "JSONStream";

export default class JsonClient {

  constructor(hull, instrumentationAgent) {
    this.hull = hull;
    this.instrumentationAgent = instrumentationAgent;

    this.req = request;
  }

  /**
   * @param  {String} jsonFileUrl
   * @return {Stream}
   */
  handleFile(jsonFileUrl) {
    const decoder = JSONStream.parse();
    return request(jsonFileUrl)
      .pipe(decoder);
  }

}
