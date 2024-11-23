require("dotenv/config");
const appConfig = process.env;

module.exports = {
  production: {
    client: "pg",
    connection: appConfig?.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};
