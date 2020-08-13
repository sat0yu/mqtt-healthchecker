"use strict";
const MQTT = require("mqtt");
const isNil = (value) => {
  return value == null;
};
exports.__esModule = true;
exports.probe = ({
  mqttBrokerUri,
  resTopic,
  reqTopic,
  message,
  regexp,
  timeout,
}) => {
  const client = MQTT.connect(mqttBrokerUri, { clientId: `mqtt-healthchecker_${Math.random().toString(16).substr(2, 8)}` });
  client.on("connect", () => {
    return console.log(
      "established a connection: " + mqttBrokerUri
    );
  });
  client.on("close", () => {
    console.log("connection closed: " + mqttBrokerUri);
  });
  client.on("message", (topic, payload) => {
    const body = payload.toString();
    console.log("received message: " + topic + " (length: " + body.length + ")");
    if (isNil(regexp)) {
      quitAsHealthy();
      return;
    }
    if (!isNil(body.match(regexp))) {
      quitAsHealthy();
      return;
    }
  });
  client.subscribe(resTopic, (err, _) => {
    if (!isNil(err)) {
      throw new Error("could not subscribe: " + resTopic);
    }
    console.log("subscribed: " + resTopic);
    client.publish(reqTopic, message, (err, _) => {
      if (!isNil(err)) {
        throw new Error(
          "could not publish the message: " + reqTopic
        );
      }
      console.log(
        "published: " +
          reqTopic +
          " (length: " +
          message.length +
          ")"
      );
    });
  });
  const timer = setTimeout(() => {
    console.log("timeout: " + timeout);
    process.exit(1);
  }, +timeout);
  const quitAsHealthy = () => {
    console.log("healthy!");
    clearTimeout(timer);
    process.exit(0);
  };
}
