import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['playwright-tests/', 'cli/']),
  {
    extends: [importPlugin.flatConfigs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
      'no-restricted-imports': 0,
      'no-param-reassign': [
        'error',
        {
          ignorePropertyModificationsForRegex: ['^acc$'],
        },
      ],
      'max-len': [
        'error',
        {
          code: 130,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],
      'prettier/prettier': ['off'],
      quotes: ['error', 'single'],
      'import/extensions': ['off'],
      'no-plusplus': [
        'error',
        {
          allowForLoopAfterthoughts: true,
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
      'import/prefer-default-export': ['off'],
      'import/no-unresolved': ['off'],
      'no-duplicate-imports': [
        'error',
        {
          includeExports: true,
        },
      ],
      'no-unused-vars': 'off',
      camelcase: ['off'],
      'no-use-before-define': ['off'],
      'no-dupe-args': ['error'],
      'no-new-object': ['error'],
      'no-inline-comments': ['error'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: 'import',
          next: '*',
        },
        {
          blankLine: 'any',
          prev: 'import',
          next: 'import',
        },
        {
          blankLine: 'always',
          prev: 'function',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'if',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'for',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
      'max-classes-per-file': ['off'],
      'no-shadow': ['off'],
      'no-unused-expressions': ['off'],
      'class-methods-use-this': ['off'],
      'no-continue': ['off'],
    },
  },
]);
