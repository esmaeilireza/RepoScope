const csp = {
  "default-src": "*",
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "style-src": ["'unsafe-inline'"],
};

module.exports = csp;