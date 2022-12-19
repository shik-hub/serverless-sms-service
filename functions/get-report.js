const moment = require("moment");

const {
  initAuroraConnection,
  endAuroraConnection,
} = require("../utils/aurora/aurora");
const { tables } = require("../utils/aurora/schema");
const { generateResponse } = require("../utils/response");
const { requestValidator } = require("../utils/schema/get-report/request");

const LIMIT = 10;

const areParamsValid = (params) => {
  try {
    const fromDate = moment(params.fromDate);
    const toDate = moment(params.toDate);
    const page = params.page;
    const perPage = params.perPage;

    if (!fromDate.isValid()) {
      console.error("from date is not valid", { params });
      throw new Error("from is not valid");
    }

    if (!toDate.isValid()) {
      console.error("to date is not valid", { params });
      throw new Error("to is not valid");
    }

    const isValidPage = !page || (page && Number(page) && Number(page) >= 0);

    if (!isValidPage) {
      console.error("page is not valid", { params });
      throw new Error("page is not valid");
    }

    const isValidPerPage = !perPage || (perPage && Number(perPage) && Number(perPage) >= 0);

    if (!isValidPerPage) {
      console.error("perPage is not valid", { params });
      throw new Error("perPage is not valid");
    }

    return true;
  } catch (err) {
    console.error("Error while validating params", { err, params });
    throw new Error("Error while validating params");
  }
}

const fetchReportData = async (fromDate, toDate, groupId, page, perPage) => {
  try {
    const offset = (page - 1) * perPage;

    console.log( { perPage, offset, page });

    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient }); 

    const response = await auroraClient.query(
      `SELECT *, count(*) OVER() AS total_count
      FROM ${tables.SMS_STATUS}
      WHERE initiated_timestamp >= $1::date AND initiated_timestamp < ($2::date + '1 day'::interval)
        AND ($3::TEXT IS NULL OR group_id = $4)
      ORDER BY initiated_timestamp ASC
      LIMIT $5 OFFSET $6`,
      [fromDate, toDate, groupId, groupId, perPage, offset]
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

const transformData = (reportData, perPage) => {
  try {
    let totalCount;
    const transformedData = reportData.map(datum => {
        if (!totalCount) totalCount = datum.total_count;
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

      const pages = Math.ceil(totalCount / perPage);


      return { totalCount, pages, transformedData };
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
    let page = Number(params.page);
    let perPage = Number(params.perPage);

    if (!page) { page = 1 }
    if (!perPage) { perPage = LIMIT }

    const reportData = await fetchReportData(fromDate, toDate, groupId, page, perPage);

    const data = transformData(reportData, perPage);

    console.log("Report has been generated successfully");
    return generateResponse(200, {
      totalPages: data.pages,
      totalEntries: data.totalCount,
      currentPage: page,
      report: data.transformedData
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