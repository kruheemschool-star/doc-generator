module.exports = {
    root: true,
    env: { browser: true, es2021: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    settings: { react: { version: 'detect' } },
    plugins: ['react-refresh'],
    ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.cjs'],
    rules: {
        // This codebase doesn't use prop-types.
        'react/prop-types': 'off',
        // Heavy use of memo(() => ...) / inline components — displayName adds noise, not safety.
        'react/display-name': 'off',
        // Thai content frequently contains quotes/apostrophes in JSX text.
        'react/no-unescaped-entities': 'off',
        // Empty catch blocks are used intentionally (e.g. private-mode localStorage).
        'no-empty': ['warn', { allowEmptyCatch: true }],
        // Allow intentionally-unused vars prefixed with _ (e.g. catch (_)).
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
};
