import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				Page: 'readonly',
				App: 'readonly',
				fetch: 'readonly',
				btoa: 'readonly',
				Date: 'readonly',
				JSON: 'readonly',
				Promise: 'readonly',
				Uint8Array: 'readonly',
				String: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-undef': 'error',
			'no-empty': ['error', { allowEmptyCatch: true }],
		},
	},
	{
		files: ['**/*.ts'],
		ignores: ['**/*.d.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: './tsconfig.json' },
			globals: {
				Page: 'readonly',
				App: 'readonly',
				fetch: 'readonly',
				btoa: 'readonly',
				Date: 'readonly',
				JSON: 'readonly',
				Promise: 'readonly',
				Uint8Array: 'readonly',
				String: 'readonly',
				console: 'readonly',
			},
		},
		plugins: { '@typescript-eslint': tsPlugin },
		rules: {
			...tsPlugin.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-empty': ['error', { allowEmptyCatch: true }],
			'no-undef': 'off', // TypeScript handles this
		},
	},
	{
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' },
		},
	},
	{
		ignores: ['node_modules/**', 'build/**', '.zeus/**', 'dist/**'],
	},
];
