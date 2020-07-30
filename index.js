"use strict";
exports.__esModule = true;
const MQTT = require("mqtt");
const HEALTHCHECK_MQTT_BROKER_URI =
  process.env.HEALTHCHECK_MQTT_BROKER_URI ||
  process.env[process.env.HEALTHCHECK_MQTT_BROKER_URI_VARIABLE_NAME];
const HEALTHCHECK_RES_TOPIC = process.env.HEALTHCHECK_RES_TOPIC;
const HEALTHCHECK_REQ_TOPIC = process.env.HEALTHCHECK_REQ_TOPIC;
const HEALTHCHECK_MESSAGE = process.env.HEALTHCHECK_MESSAGE || "";
const HEALTHCHECK_REGEXP = process.env.HEALTHCHECK_REGEXP;
const HEALTHCHECK_TIMEOUT = process.env.HEALTHCHECK_TIMEOUT || 2000;
// DO NOT IMPORT FROM utils.ts SO AS NOT TO INCREASE DEPENDENCIES
const isNil = (value) => {
  return value == null;
};
if (isNil(HEALTHCHECK_MQTT_BROKER_URI)) {
  throw new Error(
    "missing: neither HEALTHCHECK_MQTT_BROKER_URI nor HEALTHCHECK_MQTT_BROKER_URI_VARIABLE_NAME"
  );
}
if (isNil(HEALTHCHECK_RES_TOPIC)) {
  throw new Error("missing: HEALTHCHECK_RES_TOPIC");
}
if (isNil(HEALTHCHECK_REQ_TOPIC)) {
  throw new Error("missing: HEALTHCHECK_REQ_TOPIC");
}
const client = MQTT.connect(HEALTHCHECK_MQTT_BROKER_URI);
client.on("connect", () => {
  return console.log(
    "established a connection: " + HEALTHCHECK_MQTT_BROKER_URI
  );
});
client.on("close", () => {
  console.log("connection closed: " + HEALTHCHECK_MQTT_BROKER_URI);
});
client.on("message", (topic, payload) => {
  const body = payload.toString();
  console.log("received message: " + topic + " (length: " + body.length + ")");
  if (isNil(HEALTHCHECK_REGEXP)) {
    quitAsHealthy();
    return;
  }
  if (!isNil(body.match(HEALTHCHECK_REGEXP))) {
    quitAsHealthy();
    return;
  }
});
client.subscribe(HEALTHCHECK_RES_TOPIC, (err, _) => {
  if (!isNil(err)) {
    throw new Error("could not subscribe: " + HEALTHCHECK_RES_TOPIC);
  }
  console.log("subscribed: " + HEALTHCHECK_RES_TOPIC);
  client.publish(HEALTHCHECK_REQ_TOPIC, HEALTHCHECK_MESSAGE, (err, _) => {
    if (!isNil(err)) {
      throw new Error(
        "could not publish the message: " + HEALTHCHECK_REQ_TOPIC
      );
    }
    console.log(
      "published: " +
        HEALTHCHECK_REQ_TOPIC +
        " (length: " +
        HEALTHCHECK_MESSAGE.length +
        ")"
    );
  });
});
const timer = setTimeout(() => {
  console.log("timeout: " + HEALTHCHECK_TIMEOUT);
  process.exit(1);
}, +HEALTHCHECK_TIMEOUT);
const quitAsHealthy = () => {
  console.log("healthy!");
  clearTimeout(timer);
  process.exit(0);
};
