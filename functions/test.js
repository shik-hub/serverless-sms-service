const { generateResponse } = require("../utils/response");

const handler = async (event) => {
  console.log("inside handler");
  try {
    // console.log(event);
    console.log("inside try");
    return generateResponse(200, {
      message: "Its working",
    });
  } catch (error) {
    console.log("inside catch");
    console.error(error);
    return generateResponse(500, {
      message: "Some error occurred",
    });
  }
};

module.exports = {
  handler,
};
