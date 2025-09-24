import js from '@eslint/js';
import nextConfig from 'eslint-config-next';

export default [
  js.configs.recommended,
  ...nextConfig.configs.recommended,
  ...nextConfig.configs['core-web-vitals'],
  {
    rules: {
      // Add any custom rules here
    }
  }
];