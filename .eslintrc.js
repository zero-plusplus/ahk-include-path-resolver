const { typescript: { rules } } = require('@zero-plusplus/eslint-my-rules');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    tsconfigRootDir: './',
    project: [ './tsconfig.json' ],
  },
  env: {
      node: true,
      es6: true
  },
  plugins: [ "@typescript-eslint" ],
  rules: {
    ...rules,
  }
}