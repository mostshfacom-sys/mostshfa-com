/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next-build',
  
  // Webpack configuration to fix module loading issues
  webpack: (config, { dev, isServer }) => {
    // Fix for webpack module factory issues in development
    if (dev) {
      // Disable module concatenation to prevent factory issues
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        concatenateModules: false,
        runtimeChunk: false,
        splitChunks: false,
      };
      
      // Disable caching to prevent stale module issues
      config.cache = false;
      
      if (!isServer) {
        // Client-side specific fixes
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
        
        // Better error handling for HMR
        config.infrastructureLogging = {
          level: 'error',
        };
      }
    }
    
    // Resolve symlinks to prevent module resolution issues (important for pnpm)
    config.resolve.symlinks = false;
    
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allow SVG files
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['clsx', 'tailwind-merge', 'lucide-react'],
  },
  
  // Compression
  compress: true,
  
  // Power by header removal for security
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
