const Ajv = require("ajv");
const addFormats = require("ajv-formats")

const ajv = new Ajv();
addFormats(ajv);

const requestSchema = {
  type: "object",
  properties: {
    fromDate: { type: "string", format: "date" },
    toDate: { type: "string", format: "date" },
  },
  required: ["fromDate", "toDate"],
  additionalProperties: false,
};

const requestValidator = ajv.compile(requestSchema);

module.exports = {
  requestValidator,
};
