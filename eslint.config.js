import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', '.next', 'out', 'build']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tslint.configs.recommended,
            reactHooks.configs.flat.recommended,
        ],
        languageOptions: {
            globals: globals.browser,
        },
    },
]);
