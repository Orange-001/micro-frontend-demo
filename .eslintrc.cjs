/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'vue', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
  settings: {
    react: { version: '18' },
  },
  rules: {
    'prettier/prettier': 'warn',
    // React 18 + Vite 不要求显式引入 React
    'react/react-in-jsx-scope': 'off',
    // 避免 Pinia/Vue/通用函数名以 `use*` 开头时被误判为 React Hook
    'react-hooks/rules-of-hooks': 'off',
    // 微前端入口文件里常见生命周期参数，先避免影响工程体验
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      extends: ['plugin:vue/vue3-recommended'],
      rules: {
        // 以下 vue 模板格式化规则与 prettier 冲突，由 prettier 统一处理
        'vue/max-attributes-per-line': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/multiline-html-element-content-newline': 'off',
        'vue/html-closing-bracket-newline': 'off',
        'vue/html-indent': 'off',
        'vue/first-attribute-linebreak': 'off',
        'vue/html-self-closing': 'off',
      }
    }
  ]
};

