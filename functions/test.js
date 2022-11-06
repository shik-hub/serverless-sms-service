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

const generateResponse = (statusCode, body) => {
  console.log("generating response");
  const isBase64Encoded = false;
  const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    "Content-Type": "text/plain",
  };

  const response = {
    statusCode,
    isBase64Encoded,
    body: JSON.stringify(body),
    headers,
  };

  console.log("response: ", response);

  return response;
};

module.exports = {
  handler,
};
