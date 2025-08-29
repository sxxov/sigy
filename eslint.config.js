/* eslint-disable @typescript-eslint/no-dynamic-delete */
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import globals from 'globals';
// @ts-expect-error no types
import onlyWarn from 'eslint-plugin-only-warn';
// @ts-expect-error no types
import xoTypeScript from 'eslint-config-xo-typescript';
/** @import {Linter} from 'eslint' */

const config = /** @type {const} @satisfies {Linter.Config[]} */ ([
	...tseslint.configs.strictTypeChecked,
	.../** @type {Linter.Config[]} */ (xoTypeScript).map((config) => {
		if (config.rules)
			for (const k of Object.keys(config.rules))
				if (
					k.startsWith('@stylistic') ||
					k === '@typescript-eslint/no-restricted-types'
				) {
					delete config.rules[k];
				}

		if (config.plugins)
			for (const k of Object.keys(config.plugins))
				if (k.startsWith('@stylistic')) {
					delete config.plugins[k];
				}

		return { ...config };
	}),
	prettier,
	{
		languageOptions: {
			globals: {
				...Object.fromEntries(
					Object.entries(globals.node).map(([key]) => [key, 'off']),
				),
				...globals.browser,
			},
		},
		rules: {
			'no-console': 'error',
			'dot-notation': 'off',
			'@typescript-eslint/dot-notation': 'error',
			'@typescript-eslint/consistent-type-assertions': 'off',
			'no-labels': 'off',
			'no-unused-labels': 'off',
			'no-extra-label': 'off',
			'no-unused-vars': 'off',
			'no-eq-null': 'off',

			eqeqeq: [
				'error',
				'always',
				{
					null: 'ignore',
				},
			],

			'@typescript-eslint/class-literal-property-style': [
				'error',
				'fields',
			],
			'no-await-in-loop': 'off',
			'new-cap': 'off',

			'@typescript-eslint/array-type': [
				'error',
				{
					default: 'array',
				},
			],

			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: ['variable', 'accessor'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]|^$',
						match: false,
					},
				},
				{
					selector: ['classProperty'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'allow',

					filter: {
						regex: '(^\\d)|[^\\w$]|^$',
						match: false,
					},
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]|^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$',
						match: false,
					},
				},
				{
					selector: [
						'parameterProperty',
						'classMethod',
						'typeMethod',
					],
					format: ['camelCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]',
						match: false,
					},
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: 'interface',
					filter: '^(?!I)[A-Z]',
					format: ['PascalCase'],
				},
				{
					selector: 'typeParameter',
					filter: '^T$|^[A-Z][a-zA-Z]+$',
					format: ['PascalCase'],
				},
				{
					selector: 'typeAlias',
					filter: '^(?!T)[A-Z]',
					format: ['PascalCase'],
				},
				{
					selector: ['classProperty', 'objectLiteralProperty'],
					format: null,
					modifiers: ['requiresQuotes'],
				},
			],

			'capitalized-comments': 'off',
			'@typescript-eslint/no-redeclare': 'off',
			'no-empty-pattern': 'off',
			'func-names': 'off',
			'no-return-assign': 'off',
			'no-return-await': 'off',
			'array-callback-return': 'off',
			'max-params': 'off',
			'no-lonely-if': 'off',
			'object-shorthand': ['error', 'properties'],

			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/restrict-plus-operands': 'off',
			'@typescript-eslint/parameter-properties': 'off',
			'no-inner-declarations': 'off',
			'@typescript-eslint/prefer-readonly': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/no-empty-object-type': [
				'error',
				{
					allowInterfaces: 'with-single-extends',
					allowObjectTypes: 'always',
				},
			],
			'@typescript-eslint/no-invalid-void-type': [
				'error',
				{
					allowInGenericTypeArguments: true,
					allowAsThisParameter: true,
				},
			],
			'@typescript-eslint/promise-function-async': 'off',
			'@typescript-eslint/no-unnecessary-type-parameters': 'off',
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/member-ordering': 'off',
			'@typescript-eslint/no-extraneous-class': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-empty-function': 'off',
		},
	},
	{
		plugins: {
			'only-warn': onlyWarn,
		},
	},
]);

export default config;
