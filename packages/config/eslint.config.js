// Shared ESLint flat config (ARCHITECTURE §3: typescript-eslint + react-hooks).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // No `any` (ARCHITECTURE §3).
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // Config files run in Node without a project; disable type-aware linting there.
  {
    files: ['**/*.config.{js,ts}', '**/vite.base.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
