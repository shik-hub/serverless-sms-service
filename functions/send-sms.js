const AWS = require('aws-sdk');
const { generateResponse } = require("../utils/response");

const SNS = new AWS.SNS();

const DefaultSMSType = 'Promotional';

const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    if (!body || !body.phoneNumber || !body.message) {
      console.error('Phone number or message is missing')
      return generateResponse(400, { message: 'Invalid parameters' });
    }
    
    const attributeParams = {
      attributes: {
        DefaultSMSType,
      },
    };
    
    const messageParams = {
      Message: body.message,
      PhoneNumber: body.phoneNumber,
    };
    
    const attributeResponse = await SNS.setSMSAttributes(attributeParams).promise();
    const response = await SNS.publish(messageParams).promise();
    
    console.log('attributeResponse', attributeResponse);
    console.log('response', response);
    return generateResponse(200, { message: 'SMS has been sent' });
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
