module.exports = {
    root: true,
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'react', 'react-hooks'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:react/jsx-runtime',
      'next/core-web-vitals',
    ],
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    ignorePatterns: [
        '.next/**',
        'out/',
        'dist/',
        'node_modules/',
        'src/types/tauri.d.ts',
        'next-env.d.ts',
        '**/*.js',
      ],
      overrides: [
        {
          files: ['src-tauri/**/*.js'],
          rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
          },
        },
      ],
  };