module.exports = {
  extends: 'next/core-web-vitals',
  overrides: [
    {
      // Only apply these rules to test files
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        // Disable no-unused-vars for test files
        '@typescript-eslint/no-unused-vars': 'off',
        // Disable no-explicit-any for test files
        '@typescript-eslint/no-explicit-any': 'off'
      },
    },
  ],
}; 