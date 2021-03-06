import crypto from "crypto";

const algorithm = "aes-256-ctr";

export default function cryptFactory({ hostSecret }) {
  function encrypt(text) {
    const cipher = crypto.createCipher(algorithm, hostSecret);
    let crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
  }

  function decrypt(text) {
    const decipher = crypto.createDecipher(algorithm, hostSecret);
    let dec = decipher.update(text, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  }
  return { encrypt, decrypt };
}
