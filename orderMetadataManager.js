"use strict";

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.saveCompletedOrder = async (order) => {
  console.log("Guardando metadata de pedido");
  order.delivery_status = "READY_FOR_DELIVERY";
  const params = {
    TableName: process.env.COMPLETE_ORDERS_TABLE_NAME,
    Item: order,
  };

  return dynamoDb.put(params).promise();
};

module.exports.deliverOrder = async (orderId) => {
  console.log("Entregando pedido");
  const params = {
    TableName: process.env.COMPLETE_ORDERS_TABLE_NAME,
    Key: {
      orderId,
    },
    ConditionExpression: "attribute_exists(orderId)",
    UpdateExpression: "set delivery_status = :v",
    ExpressionAttributeValues: {
      ":v": "DELIVERED",
    },
    ReturnValues: "ALL_NEW",
  };

  return dynamoDb
    .update(params)
    .promise()
    .then((result) => {
      return result.Attributes;
    });
};

module.exports.getOrder = async (orderId) => {
  console.log("Obteniendo pedido");
  const params = {
    TableName: process.env.COMPLETE_ORDERS_TABLE_NAME,
    Key: {
      orderId,
    },
  };

  return dynamoDb
    .get(params)
    .promise()
    .then((result) => {
      return result.Item;
    });
};
