module.exports = {
  extends: ["@sysdotini/eslint-config", "plugin:import/typescript"],
  plugins: ["knex"],
  rules: {
    "unicorn/prefer-module": 2,
  },
};
