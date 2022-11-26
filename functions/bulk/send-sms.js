const AWS = require("aws-sdk");

const { generateResponse } = require("../../utils/response");
const {
  requestValidator,
} = require("../../utils/schema/bulk/send-sms/request");

const SNS = new AWS.SNS();

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    if (!body) {
      console.error("Request body missing");
      return generateResponse(400, { message: "Invalid parameters" });
    }

    if (!requestValidator(body)) {
      console.error("Incorrect schema of body");
      return generateResponse(400, { message: "Invalid parameters" });
    }

    console.log("smsType: ", body.type);

    const attributeParams = {
      attributes: {
        DefaultSMSType: body.type, // value can be Promotional/Transactional
      },
    };

    console.log("body", body);

    const attributeResponse = await SNS.setSMSAttributes(
      attributeParams
    ).promise();

    console.log("attributeResponse", attributeResponse);

    const promises = [];

    body.phoneNumbers.forEach((phoneNumber) => {
      const messageParams = {
        Message: body.message,
        PhoneNumber: phoneNumber,
      };
      promises.push(SNS.publish(messageParams).promise());
    });

    const responses = await Promise.all(promises);

    console.log("response", responses);

    console.log("Request received successfully");
    return generateResponse(200, { message: "All data sent to SNS" });
  } catch (error) {
    console.error(error);
    return generateResponse(500, {
      message: "Some error occurred",
    });
  }
};

module.exports = {
  handler,
};
