const { Client } = require("pg");
const { tables, schema } = require("./schema");

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

const createTables = async (auroraClient) => {
  try {
    console.log("Creating table...");
    const response = await auroraClient.query(
      `CREATE TABLE IF NOT EXISTS ${tables.SMS_STATUS} (${schema.SMS_STATUS})`
    );
    console.log("SMS table created successfully", { response });
  } catch (err) {
    console.log("Error while creating table.", err);
    throw new Error("Error while creating table");
  }
};

const initAuroraConnection = async () => {
  try {
    console.log("Connecting aurora client...", {
      auroraDBUsername,
      auroraDBHost,
      auroraDBPort,
      auroraDBName,
    });

    const client = new Client(config);
    await client.connect();

    await createTables(client);

    console.log("Connected");
    return client;
  } catch (err) {
    console.error("Error connecting to DB: ", err);
    throw new Error("Could not connect to DB");
  }
};

const endAuroraConnection = async (auroraClient) => {
  try {
    console.log("Disconnecting aurora client...");
    const response = await auroraClient.end();
    console.log("Disconnected", { response });
  } catch (err) {
    console.error("Error disconnecting DB: ", err);
    throw new Error("Could not disconnect DB");
  }
};

module.exports = {
  initAuroraConnection,
  endAuroraConnection,
  createTables,
};
