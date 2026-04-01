import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				// Zepp OS device-side globals
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
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' },
		},
	},
	{
		ignores: ['node_modules/**', 'build/**', '.zeus/**'],
	},
];
