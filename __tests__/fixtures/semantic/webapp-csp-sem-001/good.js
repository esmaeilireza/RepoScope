const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'nonce-{NONCE}'"],
  "style-src": ["'self'", "'nonce-{NONCE}'"],
  "img-src": ["'self'", "data:", "https://cdn.example.com"],
  "connect-src": ["'self'", "https://api.example.com"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

module.exports = csp;