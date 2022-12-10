const AWS = require("aws-sdk");
const lodash = require("lodash");

const {
  initAuroraConnection,
  endAuroraConnection,
} = require("../utils/aurora/aurora");
const { tables } = require("../utils/aurora/schema");
const { sms } = require("../utils/constants");
const { generateResponse } = require("../utils/response");
const { requestValidator } = require("../utils/schema/send-sms/request");

const SNS = new AWS.SNS();

const SOURCE_SQS = "source_sqs";
const SOURCE_HTTP = "source_http";

const parseBody = (event) => {
  try {
    let body;
    if (lodash.get(event, "Records[0].eventSource", "") == "aws:sqs") {
      console.log("source: ", SOURCE_SQS);
      body = JSON.parse(JSON.parse(event.Records[0].body).Message);
    } else if (lodash.get(event, "httpMethod", "").length > 0) {
      console.log("source: ", SOURCE_HTTP);
      body = JSON.parse(event.body);
    } else {
      console.error("Unknown source", { event });
      throw new Error("Unknown source");
    }
    console.log("body: ", body);
    return body;
  } catch (err) {
    console.error("Error parsing body", { err, event });
    throw new Error("Error parsing body");
  }
};

const insertRequestInDB = async (body) => {
  try {
    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient });

    const data = [
      sms.status.REQUESTED,
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now(), now())
      RETURNING sms_id`,
      data
    );

    console.log("Inserted request into DB successfully", { response });

    const smsId = lodash.get(response, "rows[0].sms_id", undefined);

    if (smsId) {
      console.log("sms_id for inserted data: ", smsId);
    } else {
      console.error("sms_id was not returned after insertion", {
        smsId,
        rows: response.rows,
      });
      throw new Error("sms_id not returned");
    }

    await endAuroraConnection(auroraClient);
    return smsId;
  } catch (err) {
    console.error("Error inserting request in DB", { err, body });
    throw new Error("Error inserting request in DB");
  }
};

const updateMessageIdInDB = async (smsId, messageId) => {
  try {
    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient });

    const response = await auroraClient.query(
      `UPDATE ${tables.SMS_STATUS}
      SET message_id = $1, status = $2
      WHERE sms_id = $3`,
      [messageId, sms.status.PENDING, smsId]
    );

    console.log("Updated messageId DB successfully", { response });

    await endAuroraConnection(auroraClient);
  } catch (err) {
    console.error("Error updating messageId in DB", {
      err,
      smsId,
      messageId,
    });
    throw new Error("Error updating messageId in DB");
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

    const smsId = await insertRequestInDB(body);

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

    const messageId = response.MessageId;

    await updateMessageIdInDB(smsId, messageId);

    console.log("SMS has been sent successfully", { messageId });
    return generateResponse(200, {
      message: "SMS has been sent",
      messageId,
    });
  } catch (error) {
    console.error("Some error occurred while sending SMS", { error });
    return generateResponse(500, {
      message: "Some error occurred while sending SMS",
    });
  }
};

module.exports = {
  handler,
};
