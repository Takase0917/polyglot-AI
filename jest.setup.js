// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
  }),
}));

// Mock Web Speech API
if (typeof window !== 'undefined') {
  window.webkitSpeechRecognition = jest.fn().mockImplementation(() => ({
    continuous: false,
    interimResults: false,
    lang: '',
    start: jest.fn(),
    stop: jest.fn(),
    onresult: jest.fn(),
    onerror: jest.fn(),
  }));
}

// Mock environment variables for testing
process.env = {
  ...process.env,
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_APPLICATION_CREDENTIALS_JSON: '{"type":"service_account","project_id":"test-project"}',
}; 