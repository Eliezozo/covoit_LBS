module.exports = {
  root: true,
  extends: ['expo', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off'
  }
};
