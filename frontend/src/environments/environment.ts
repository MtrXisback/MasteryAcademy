export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:8080'
    : ''
};
