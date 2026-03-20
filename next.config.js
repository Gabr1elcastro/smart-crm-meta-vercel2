/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para desenvolvimento
  experimental: {
    // Habilitar APIs do Next.js
    appDir: true,
  },
  
  // Configurações de API
  async rewrites() {
    return [
      {
        source: '/api/webhook-proxy',
        destination: '/api/webhook-proxy',
      },
    ];
  },
  
  // Configurações de CORS para APIs
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
