const AWS = require("aws-sdk");

const { generateResponse } = require("../../utils/response");
const { requestValidator } = require("../../utils/schema/bulk/send-sms/request");

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

    console.log('body', body);

    return generateResponse(200, { message: "Working" });

    const messageParams = {
      Message: body.message,
      PhoneNumber: body.phoneNumber,
    };

    const attributeResponse = await SNS.setSMSAttributes(
      attributeParams
    ).promise();
    const response = await SNS.publish(messageParams).promise();

    console.log("attributeResponse", attributeResponse);
    console.log("response", response);
    console.log("SMS has been sent successfully");
    return generateResponse(200, { message: "SMS has been sent" });
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
