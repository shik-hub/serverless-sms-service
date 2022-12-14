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
    clientId: { type: "integer", minimum: 0 },
    enterpriseId: { type: "integer", minimum: 0 },
    groupId: { type: "integer", minimum: 0 },
  },
  required: [
    "users",
    "message",
    "type",
    "category",
    "requestUserId",
    "clientId",
    "groupId",
  ],
  additionalProperties: false,
};

const requestValidator = ajv.compile(requestSchema);

module.exports = {
  requestValidator,
};
