const AWS = require("aws-sdk");
const lodash = require("lodash");

const { generateResponse } = require("../utils/response");
const { requestValidator } = require("../utils/schema/send-sms/request");

const SNS = new AWS.SNS();

const SOURCE_SQS = "source_sqs";
const SOURCE_HTTP = "source_http";

const parseBody = (event) => {
  let body;
  if (lodash.get(event, "Records[0].eventSource", "") == "aws:sqs") {
    console.log("source: ", SOURCE_SQS);
    body = JSON.parse(JSON.parse(event.Records[0].body).Message);
  } else if (lodash.get(event, "httpMethod", "").length > 0) {
    console.log("source: ", SOURCE_HTTP);
    body = JSON.parse(event.body);
  } else {
    throw new Error("Unknown source");
  }
  console.log("body: ", body);
  return body;
};

const handler = async (event) => {
  try {
    const body = parseBody(event);

    if (!body) {
      console.error("Request body missing");
      return generateResponse(400, { message: "Invalid parameters" });
    }

    if (!requestValidator(body)) {
      console.error("Incorrect schema of body", body);
      return generateResponse(400, { message: "Invalid parameters" });
    }

    console.log("smsType: ", body.type);

    const attributeParams = {
      attributes: {
        DefaultSMSType: body.type, // value can be Promotional/Transactional
      },
    };

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
    return generateResponse(200, {
      message: "SMS has been sent",
      messageId: response.MessageId,
    });
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
