// Update with your config settings.

const config = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
  },

  // staging: {
  //   client: "6",
  //   connection: {
  //     filename: "./",
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: "knex_migrations",
  //   },
  // },

  production: {
    client: "sqlite3",
    connection: {
      filename: "./prod.sqlite3",
    },
  },
};

export default config;
