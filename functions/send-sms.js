const AWS = require("aws-sdk");
const lodash = require("lodash");

const {
  initAuroraConnection,
  endAuroraConnection,
} = require("../utils/aurora/aurora");
const { tables } = require("../utils/aurora/schema");
const { status } = require("../utils/constants");
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

const insertRequestInDB = async (body) => {
  try {
    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient });

    const data = [
      status.PENDING,
      body.phoneNumber,
      body.message,
      body.type,
      body.category,
      body.recipientId,
      body.recipientName,
      body.requestUserId,
      body.clientId,
      body.enterpriseId,
      body.groupId,
    ];

    const response = await auroraClient.query(
      `INSERT INTO ${tables.SMS_STATUS} \
      (status, phone_number, sms_content, sms_type, sms_category, recipient_user_id, \
      recipient_user_name, request_user_id, client_id, enterprise_id, group_id, \
      initiated_timestamp, created_at, updated_at) \
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now(), now())`,
      data
    );

    console.log("Inserted request into DB successfully", { response });

    await endAuroraConnection(auroraClient);
  } catch (err) {
    console.error("Error inserting request in DB", err);
    throw new Error("Error inserting request in DB");
  }
};

const handler = async (event) => {
  try {
    const body = parseBody(event);

    if (!body) {
      console.error("Request body missing");
      return generateResponse(400, { message: "Invalid parameters" });
    }

    if (!requestValidator(body)) {
      console.error("Incorrect schema of body", {
        body,
        error: requestValidator.errors,
      });
      return generateResponse(400, { message: "Invalid parameters" });
    }

    await insertRequestInDB(body);

    console.log("smsType: ", body.type);

    const attributeParams = {
      attributes: {
        DefaultSMSType: body.type,
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
