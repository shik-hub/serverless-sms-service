const Ajv = require("ajv");
const ajv = new Ajv();

const userArray = {
  type: "object",
  properties: {
    phoneNumber: { type: "string", pattern: "^\\+\\d{8,14}$" },
    recipientName: { type: "string", minLength: 1 },
    recipientId: { type: "integer", minimum: 0 },
  },
  required: ["phoneNumber", "recipientName"],
};

const requestSchema = {
  type: "object",
  properties: {
    users: {
      type: "array",
      items: userArray,
      minItems: 1,
      maxItems: 200,
    },
    message: { type: "string", minLength: 1 },
    type: { enum: ["Promotional", "Transactional"] },
    category: { type: "string", minLength: 1 },
    requestUserId: { type: "integer", minimum: 0 },
    requestUserName: { type: "string", minLength: 1 },
    clientId: { type: "integer", minimum: 0 },
    enterpriseId: { type: "integer", minimum: 0 },
    groupId: { type: "integer", minimum: 0 },
    groupName: { type: "string", minLength: 1 },
    senderId: { type: "string", pattern: "^(?=[A-Za-z])([A-Za-z0-9-]{1,11})$" },
  },
  required: [
    "users",
    "message",
    "type",
    "category",
    "requestUserId",
    "requestUserName",
    "clientId",
    "groupId",
    "groupName"
  ],
  additionalProperties: false,
};

const requestValidator = ajv.compile(requestSchema);

module.exports = {
  requestValidator,
};
