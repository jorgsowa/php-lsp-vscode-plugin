import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
    {
        ignores: ['out', 'node_modules'],
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            ecmaVersion: 2023,
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'warn',
                { selector: 'import', format: ['camelCase', 'PascalCase'] },
            ],
            curly: 'warn',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            semi: 'warn',
        },
    },
);
