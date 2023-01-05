const tables = {
  SMS_STATUS: "sms_status",
};

const schema = {
  SMS_STATUS:
    "sms_id BIGSERIAL PRIMARY KEY, /* primary key */ \
  message_id VARCHAR(50) UNIQUE, /* unique message id returned by SNS */ \
  sms_type VARCHAR(20) NOT NULL, /* Promotional or Transactional */ \
  sms_category VARCHAR(50) NOT NULL, /* Eg: Send Tour, Outstanding SMS etc. */ \
  sms_content TEXT, /* Actual content of the SMS sent */ \
  phone_number VARCHAR(20) NOT NULL, /* phone number to which the SMS was sent */ \
  recipient_user_name VARCHAR(50) NOT NULL, /* recipient user name */ \
  recipient_user_id BIGINT NOT NULL, /* recipient user id */ \
  request_user_id BIGINT NOT NULL, /* user id who requested to send the SMS */ \
  price_in_usd DECIMAL(10,7), /* price spent to send the SMS */ \
  status VARCHAR(20) NOT NULL, /* current status. Can be SUCCESS, FAILURE, PENDING */ \
  provider_response TEXT, /* response from the SMS provider. Should explain status */ \
  sender_id VARCHAR(20) NOT NULL, /* client id */ \
  client_id BIGINT, /* client id */ \
  enterprise_id BIGINT, /* enterprise id */ \
  group_id BIGINT, /* group id */ \
  initiated_timestamp TIMESTAMPTZ NOT NULL, /* timestamp when the SMS request was initiated */ \
  sent_timestamp TIMESTAMPTZ, /* timestamp when the SMS was sent */ \
  created_at TIMESTAMPTZ NOT NULL, /* timestamp when the DB record was created */ \
  updated_at TIMESTAMPTZ NOT NULL /* timestamp when the DB record was updated */",
};

module.exports = {
  tables,
  schema,
};
