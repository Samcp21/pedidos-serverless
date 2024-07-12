"use strict";

const { v1: uuidv1 } = require("uuid");
const AWS = require("aws-sdk");

const orderMetadataManager = require("./orderMetadataManager");

var sqs = new AWS.SQS({ region: process.env.REGION });
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE;

module.exports.hacerPedido = (event, context, callback) => {
  console.log("HacerPedido fue llamada");
  const body = JSON.parse(event.body);
  const order = {
    orderId: uuidv1(),
    name: body.name,
    address: body.address,
    pizzas: body.pizzas,
    timestamp: Date.now(),
  };

  const params = {
    MessageBody: JSON.stringify(order),
    QueueUrl: QUEUE_URL,
  };

  sqs.sendMessage(params, function (err, data) {
    if (err) {
      sendResponse(500, err, callback);
    } else {
      const message = {
        order,
        messageId: data.MessageId,
      };
      sendResponse(200, message, callback);
    }
  });
};

module.exports.prepararPedido = (event, context, callback) => {
  console.log("Preparar pedido fue llamada");

  const order = JSON.parse(event.Records[0].body);

  orderMetadataManager
    .saveCompletedOrder(order)
    .then(() => {
      callback();
    })
    .catch((err) => {
      callback(err);
    });
};

module.exports.enviarPedido = (event, context, callback) => {
  console.log("Enviar pedido fue llamada");

  const record = event.Records[0];
  if (record.eventName === "INSERT") {
    const orderId = record.dynamodb.Keys.orderId.S;

    orderMetadataManager
      .deliverOrder(orderId)
      .then(() => {
        console.log(data);
        callback();
      })
      .catch((err) => {
        callback(err);
      });
  } else {
    console.log("No se hizo nada");
    callback();
  }
};

module.exports.checkearEstadoPedido = (event, context, callback) => {
  console.log("Checkear estado pedido fue llamada");

  const orderId = event.pathParameters.orderId;

  orderMetadataManager
    .getOrder(orderId)
    .then((order) => {
      if (order) {
        sendResponse(200, order, callback);
      } else {
        sendResponse(404, { error: "Pedido no encontrado" }, callback);
      }
    })
    .catch((err) => {
      sendResponse(500, err, callback);
    });
};

function sendResponse(statusCode, message, callback) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
  callback(null, response);
}
