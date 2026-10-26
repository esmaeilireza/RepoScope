const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'nonce-{NONCE}'"],
  "object-src": ["'none'"],
};

module.exports = csp;