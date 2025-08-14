// This custom type declaration file is used to provide TypeScript with
// definitions for non-JavaScript/TypeScript modules like CSS and JSON.
// It replaces the original `/// <reference types="vite/client" />` which
// was causing a type resolution error, likely due to an environment
// configuration issue.

/**
 * Declares CSS modules. This allows TypeScript to understand
 * imports like `import './App.css';` which are used for their
 * side effect of adding styles to the document.
 */
declare module '*.css' {}

/**
 * Declares JSON modules. This allows importing JSON files directly
 * into the application, which is used by the i18n setup.
 * e.g., `import translations from './locales/en/translation.json';`
 */
declare module '*.json' {
  const value: any;
  export default value;
}
