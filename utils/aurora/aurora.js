const { Client } = require("pg");
const { CREATE_SMS_TABLE } = require("../schema");

const {
  auroraDBUsername,
  auroraDBPassword,
  auroraDBHost,
  auroraDBPort,
  auroraDBName,
} = process.env;

const config = {
  host: auroraDBHost,
  port: auroraDBPort,
  user: auroraDBUsername,
  password: auroraDBPassword,
  database: auroraDBName,
};

let client = new Client(config);

const createTables = async (client) => {
  try {
    console.log("Creating table...");
    const response = await client.query(CREATE_SMS_TABLE);
    console.log("SMS table created successfully");
  } catch (err) {
    console.log("Error while creting table.", err);
    throw new Error("Error while creating table");
  }
};

const initAurora = async () => {
  try {
    console.log("Connecting...", {
      auroraDBUsername,
      auroraDBHost,
      auroraDBPort,
      auroraDBName,
    });
    await client.connect();
    console.log("Connected");
    return client;
  } catch (err) {
    console.error("Error connecting to DB: ", err);
    throw new Error("Could not connect to DB");
  }
};

module.exports = {
  initAurora,
};
