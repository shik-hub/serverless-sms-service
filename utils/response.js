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
  generateResponse,
};
