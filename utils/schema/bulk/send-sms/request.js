const Ajv = require("ajv");
const ajv = new Ajv();

const requestSchema = {
  type: "object",
  properties: {
    phoneNumbers: {
      type: "array",
      items: {
        type: "string",
        pattern: "^\\+\\d{8,14}$",
      },
      minItems: 1,
      maxItems: 200,
    },
    message: { type: "string", minLength: 1 },
    type: { enum: ["Promotional", "Transactional"] },
  },
  required: ["phoneNumbers", "message", "type"],
  additionalProperties: false,
};

const requestValidator = ajv.compile(requestSchema);

module.exports = {
  requestValidator,
};
