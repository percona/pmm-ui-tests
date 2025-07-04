import { defineConfig } from "eslint/config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    extends: [
      importPlugin.flatConfigs.recommended,
      tseslint.configs.recommended,
    ],
    "settings": {
      "import/resolver": {
        "typescript": true,
        "node": true,
      },
    },
    rules: {
      "playwright/expect-expect": ["off"],
      "playwright/no-wait-for-timeout": ["off"],
      "@typescript-eslint/no-useless-constructor": ["off"],
      "@typescript-eslint/await-thenable": ["off"],
      "arrow-spacing": "error",
      "brace-style": ["error", "stroustrup", {
        allowSingleLine: true,
      }],
      "consistent-return": "off",
      "dot-notation": "off",
      "eol-last": "off",
      eqeqeq: "error",
      "func-names": "off",
      "func-style": "off",
      indent: ["error", 2],

      "import/extensions": ["error", "ignorePackages", {
        js: "always",
      }],

      "import/no-import-module-exports": "off",
      "import/no-relative-packages": "off",
      "implicit-arrow-linebreak": "error",
      "keyword-spacing": "error",
      "linebreak-style": "off",
      "no-array-constructor": "error",
      "no-await-in-loop": "off",
      "no-console": "off",
      "no-confusing-arrow": "error",
      "no-nested-ternary": "warn",
      "no-unused-vars": "error",
      "no-new-object": "error",
      "no-new-func": "error",
      "no-restricted-syntax": "off",
      "no-restricted-properties": "error",
      "no-redeclare": "off",
      "no-loop-func": "off",
      "no-trailing-spaces": "off",
      "no-plusplus": "off",
      "no-extra-semi": "error",
      "no-undef": "off",
      "nonblock-statement-body-position": "error",
      "no-multiple-empty-lines": "error",
      "no-multi-assign": "off",
      "newline-per-chained-call": ["error", {ignoreChainWithDepth:3}],
      "no-var": "error",
      "one-var": "off",
      "prefer-arrow-callback": "off",
      "prefer-const": "error",
      "padded-blocks": "off",
      "prettier/prettier": "off",
      "prefer-spread": "error",
      "space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
      }],        
      "space-before-blocks": "error",
      "spaced-comment": "error",
      "space-infix-ops": "error",
      "space-in-parens": "error",
      quotes: "error",
    },
  }, {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "commonjs",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      "no-empty-pattern": "off",
      "@typescript-eslint/no-unsafe-assignment": ["off"],
      "@typescript-eslint/no-unused-vars": ["error", {
        vars: "all",
      }],
      "@typescript-eslint/no-unsafe-member-access": ["off"],
      "@typescript-eslint/no-misused-promises": ["off"],
      "@typescript-eslint/no-unsafe-call": ["off"],
      "@typescript-eslint/ban-ts-comment": ["off"],
      "@typescript-eslint/require-await": ["off"],
      "@typescript-eslint/await-thenable": ["off"],
      "@typescript-eslint/restrict-template-expressions": ["off"],
      "@typescript-eslint/no-use-before-define": ["error", {
        functions: false,
        classes: true,
        variables: true,
      }],
      "import/no-extraneous-dependencies": ["error", {
        devDependencies: true,
      }],
      "import/prefer-default-export": "off",
      "no-continue": ["off"],
      "playwright/expect-expect": ["off"],
      "playwright/no-wait-for-timeout": ["off"],
      "no-plusplus": "off",
      "no-await-in-loop": "off",
      "max-classes-per-file": "off",
      "arrow-body-style": ["off"],
      quotes: ["error", "single", {
        avoidEscape: true,
        allowTemplateLiterals: true,
      }],
      "no-restricted-syntax": ["off", "ForInStatement", "ForOffStatement"],
      "prefer-destructuring": "off",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", {
        max: 1,
        maxBOF: 0,
        maxEOF: 0,
      }],
      "eol-last": ["error", "always"],
      "linebreak-style": "off",
      "@typescript-eslint/lines-between-class-members": "off",
      "class-methods-use-this": "off",
      "arrow-spacing": "error",
      "max-len": ["warn", {
        code: 160,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      }],
      "padding-line-between-statements": ["error", {
        blankLine: "always",
        prev: "import",
        next: "*",
      }, {
        blankLine: "any",
        prev: "import",
        next: "import",
      }, {
        blankLine: "always",
        prev: "function",
        next: "*",
      }],
      "object-curly-newline": ["warn", {
        ObjectExpression: {
          multiline: true,
          minProperties: 3,
        },
        ObjectPattern: {
          multiline: true,
        },
        ImportDeclaration: {
          multiline: true,
          minProperties: 4,
        },
        ExportDeclaration: {
          multiline: true,
          minProperties: 4,
        }
      }],
    },
  }
]);