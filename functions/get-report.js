const moment = require("moment");

const {
  initAuroraConnection,
  endAuroraConnection,
} = require("../utils/aurora/aurora");
const { tables } = require("../utils/aurora/schema");
const { generateResponse } = require("../utils/response");
const { requestValidator } = require("../utils/schema/get-report/request");

const areParamsValid = (params) => {
  try {
    const fromDate = moment(params.fromDate);
    const toDate = moment(params.toDate);

    const diffInDays = toDate.diff(fromDate, 'days'); // toDate minus fromDate

    if (diffInDays < 0) {
      console.error("from date should be less than or equal to to date", { params, diffInDays });
      throw new Error("from date should be less than or equal to to date");
    }

    if (diffInDays > 7) {
      console.error("date range should be less than 8 days", { params, diffInDays });
      throw new Error("date range should be less than 8 days");
    }

    return true;
  } catch (err) {
    console.error("Error while validating params", { err, params });
    throw new Error("Error while validating params");
  }
}

const fetchReportData = async (fromDate, toDate, groupId) => {
  try {
    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient });

    const response = await auroraClient.query(
      `SELECT * FROM ${tables.SMS_STATUS}
      WHERE initiated_timestamp >= $1::date AND initiated_timestamp < ($2::date + '1 day'::interval)
        AND ($3::TEXT IS NULL OR group_id = $4)
      ORDER BY initiated_timestamp ASC`,
      [fromDate, toDate, groupId, groupId]
    );

    const data = response.rows;

    console.log("Report data fetched successfully", { data, response });

    await endAuroraConnection(auroraClient);

    return data;
  } catch (err) {
    console.error("Error while fetching report data", { err, fromDate, toDate });
    throw new Error("Error while fetching report data");
  }
}

const transformData = (reportData) => {
  try {
    const transformedData = reportData.map(datum => {
        return {
          smsId: datum.sms_id,
          messageId: datum.message_id,
          dateRequested: datum.initiated_timestamp,
          dateSent: datum.sent_timestamp,
          smsCategory: datum.sms_category,
          message: datum.sms_content,
          recipient: {
            id: datum.recipient_user_id,
            name: datum.recipient_user_name,
            phoneNumber: datum.phone_number,
          },
          status: datum.status,
          statusReason: datum.provider_response,
          price: datum.price_in_usd,
          clientId: datum.client_id,
          enterpriseId: datum.enterprise_id,
          groupId: datum.group_id
        }
      });

      return transformedData;
  } catch (err) {
    console.error("Error while transforming report data", { err });
    throw new Error("Error while transforming report data");
  }
};

const handler = async (event) => {
  try {
    const params = event.queryStringParameters;

    if (!params) {
      console.error("Request params missing");
      return generateResponse(400, { message: "Invalid parameters" });
    }

    if (!requestValidator(params)) {
      console.error("Incorrect schema of params", {
        params,
        error: requestValidator.errors,
      });
      return generateResponse(400, { message: "Invalid parameters" });
    }

    if (!areParamsValid(params)) {
      console.error("Invalid params", { params });
      throw new Error("Invalid params");
    }

    console.log(params);

    const { fromDate, toDate, groupId } = params;

    const reportData = await fetchReportData(fromDate, toDate, groupId);

    const report = transformData(reportData);

    console.log("Report has been generated successfully");
    return generateResponse(200, {
      report
    });
  } catch (err) {
    console.error("Error while fetching report", { err });
    return generateResponse(500, {
      message: "Some error occurred while fetching report",
    });
  }
}

module.exports = {
  handler,
};