const Ajv = require("ajv");
const ajv = new Ajv();

const requestSchema = {
  type: "object",
  properties: {
    phoneNumber: { type: "string", pattern: "^\\+\\d{8,14}$" },
    message: { type: "string", minLength: 1 },
    type: { enum: ["Promotional", "Transactional"] },
    category: { type: "string", minLength: 1 },
    recipientName: { type: "string", minLength: 1 },
    recipientId: { type: "integer", minimum: 0 },
    requestUserId: { type: "integer", minimum: 0 },
    clientId: { type: "integer", minimum: 0 },
    enterpriseId: { type: "integer", minimum: 0 },
    groupId: { type: "integer", minimum: 0 },
    senderId: { type: "string", pattern: "^(?=[A-Za-z])([A-Za-z0-9-]{1,11})$" },
  },
  required: [
    "phoneNumber",
    "message",
    "type",
    "category",
    "recipientName",
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
