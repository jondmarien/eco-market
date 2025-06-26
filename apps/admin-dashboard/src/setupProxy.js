const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // User Service Proxy
  app.use(
    '/api/users',
    createProxyMiddleware({
      target: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: {
        '^/api/users': '/api', // Remove /users from the path if needed
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/users:', err.message);
      },
    })
  );
  
  // Product Service Proxy
  app.use(
    '/api/products',
    createProxyMiddleware({
      target: process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:8002',
      changeOrigin: true,
      pathRewrite: {
        '^/api/products': '/api',
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/products:', err.message);
      },
    })
  );
  
  // Order Service Proxy
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:8003',
      changeOrigin: true,
      pathRewrite: {
        '^/api/orders': '/api',
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/orders:', err.message);
      },
    })
  );
  
  // Payment Service Proxy
  app.use(
    '/api/payments',
    createProxyMiddleware({
      target: process.env.REACT_APP_PAYMENT_SERVICE_URL || 'http://localhost:8004',
      changeOrigin: true,
      pathRewrite: {
        '^/api/payments': '/api',
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/payments:', err.message);
      },
    })
  );
  
  // Inventory Service Proxy  
  app.use(
    '/api/inventory',
    createProxyMiddleware({
      target: process.env.REACT_APP_INVENTORY_SERVICE_URL || 'http://localhost:8005',
      changeOrigin: true,
      pathRewrite: {
        '^/api/inventory': '/api',
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/inventory:', err.message);
      },
    })
  );
  
  // Analytics Service Proxy (Admin only)
  app.use(
    '/api/analytics',
    createProxyMiddleware({
      target: process.env.REACT_APP_ANALYTICS_SERVICE_URL || 'http://localhost:8006',
      changeOrigin: true,
      pathRewrite: {
        '^/api/analytics': '/api',
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /api/analytics:', err.message);
      },
    })
  );
  
  // Health check proxy for all services
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'http://localhost:8001', // Default to user service
      changeOrigin: true,
      router: (req) => {
        // Route health checks to appropriate services based on query parameter
        const service = req.query.service;
        switch(service) {
          case 'products': return 'http://localhost:8002';
          case 'orders': return 'http://localhost:8003';
          case 'payments': return 'http://localhost:8004';
          case 'inventory': return 'http://localhost:8005';
          case 'analytics': return 'http://localhost:8006';
          default: return 'http://localhost:8001';
        }
      },
      onError: (err, req, res) => {
        console.error('Proxy error for /health:', err.message);
      },
    })
  );
};
