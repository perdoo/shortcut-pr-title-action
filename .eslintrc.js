module.exports = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  env: { es6: true, node: true, jest: true },
  parserOptions: { ecmaVersion: 2018 },
  rules: {
    "prettier/prettier": "warn",
  },
};
