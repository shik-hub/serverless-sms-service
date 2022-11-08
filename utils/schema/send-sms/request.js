const Ajv = require("ajv");
const ajv = new Ajv();

const requestSchema = {
  type: "object",
  properties: {
    phoneNumber: {type: "string", pattern: "^\\+\\d{8,14}$"},
    message: {type: "string", "minLength": 1}
  },
  required: ["phoneNumber", "message"],
  additionalProperties: false,
}

const requestValidator = ajv.compile(requestSchema);

module.exports = {
    requestValidator
};
