const AWS = require("aws-sdk");

const { generateResponse } = require("../../utils/response");
const {
  requestValidator,
} = require("../../utils/schema/bulk/send-sms/request");

const { notificationTopicArn } = process.env;

const SNS = new AWS.SNS({ apiVersion: "2010-03-31" });

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

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

    console.log("body", body);

    const promises = [];

    body.phoneNumbers.forEach((phoneNumber) => {
      const message = {
        message: body.message,
        phoneNumber: phoneNumber,
        type: body.type,
      };

      const params = {
        Message: JSON.stringify(message),
        TopicArn: notificationTopicArn,
      };

      const promise = SNS.publish(params)
        .promise()
        .then((result) => {
          return {
            type: "SUCCESS",
            params,
            result,
          };
        })
        .catch((error) => {
          return {
            type: "ERROR",
            params,
            error,
          };
        });

      promises.push(promise);
    });

    const responses = await Promise.all(promises);

    console.log("response", responses);

    const errors = responses.filter((response) => response.type === "ERROR");

    if (errors.length > 0) {
      console.log("Partial errors occurred");
      generateResponse(202, {
        message:
          "Partial failure occurred. Refer to the error object for more details",
        error: errors,
      });
    } else {
      console.log("Request received successfully");
      return generateResponse(200, { message: "All data sent to SNS" });
    }
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
