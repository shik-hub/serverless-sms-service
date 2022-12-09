const lodash = require("lodash");

const {
  initAuroraConnection,
  endAuroraConnection,
} = require("../utils/aurora/aurora");
const { tables } = require("../utils/aurora/schema");

const updateDeliveryDetailsInDB = async (
  messageId,
  priceInUsd,
  providerResponse,
  status
) => {
  try {
    const auroraClient = await initAuroraConnection();
    console.log({ auroraClient });

    const response = await auroraClient.query(
      `UPDATE ${tables.SMS_STATUS}
      SET status = $1, price_in_usd = $2, provider_response = $3,
      sent_timestamp = now(), updated_at = now()
      WHERE message_id = $4`,
      [status, priceInUsd, providerResponse, messageId]
    );

    console.log("Ran update query successfully", { response });

    const { rowCount } = response;

    await endAuroraConnection(auroraClient);

    if (rowCount < 1) {
      console.log(
        "No rows updated. Possibly messageid exists in a different environment",
        {
          rowCount,
          messageId,
        }
      );
    } else if (rowCount == 1) {
      console.log("Updated delivery details in DB successfully", {
        rowCount,
        messageId,
      });
    } else {
      console.log(
        "Execution should nevver reach here. Multiple sms have same messageId. Check immediately",
        {
          rowCount,
          messageId,
          status,
          providerResponse,
          priceInUsd,
        }
      );
    }
    return;
  } catch (err) {
    console.error("Error while updating delivery details in DB", {
      err,
      messageId,
      priceInUsd,
      providerResponse,
      status,
    });
    throw new Error("Error while updating delivery details in DB");
  }
};

const handler = async (event) => {
  try {
    const messageId = lodash.get(event, "notification.messageId", undefined);
    const priceInUsd = lodash.get(event, "delivery.priceInUSD", 0);
    const providerResponse = lodash.get(
      event,
      "delivery.providerResponse",
      undefined
    );
    const status = lodash.get(event, "status", undefined);

    if (
      messageId === undefined ||
      providerResponse === undefined ||
      status === undefined
    ) {
      console.error("Invalid parameters", {
        event,
        messageId,
        priceInUsd,
        providerResponse,
        status,
      });
    } else {
      await updateDeliveryDetailsInDB(
        messageId,
        priceInUsd,
        providerResponse,
        status
      );
    }

    console.log("Success");
    return "Success";
  } catch (err) {
    console.error("Error while updating delivery status of SMS", {
      err,
      event,
    });
    throw new Error("Error while updating delivery status of SMS");
  }
};

module.exports = {
  handler,
};
