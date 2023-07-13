module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', { js: 'never' }],
    'import/no-unresolved': 'off',
    'no-underscore-dangle': 'off',
    'linebreak-style': 0,
    'max-len': [2, 250, 8, { ignoreUrls: true }],
    'consistent-return': 'off',
    'func-names': 'off',
    'allowForLoopAfterthoughts': true,
  },
};
