// custom env file
const path = require("path");
const node_env = process.env.NODE_ENV || "development";
const customEnvFilePath = path.resolve(__dirname, "env", `.env.${node_env}`);
// require dotenv configuration
require("dotenv").config({ path: customEnvFilePath });
