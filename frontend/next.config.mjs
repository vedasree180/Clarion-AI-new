/** @type {import('next').NextConfig} */

// PWA configuration using next-pwa
// When next-pwa is installed (npm install), it will automatically
// generate service worker files in the public folder during build.
// For development, PWA features are disabled to avoid caching issues.

let nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Ensure common paths redirect correctly to avoid 404s
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  // Required for Capacitor native app builds
  output: process.env.BUILD_TARGET === 'capacitor' ? 'export' : undefined,
  images: {
    unoptimized: process.env.BUILD_TARGET === 'capacitor',
  },
  // Fix for Next.js Turbopack workspace root detection. Set the
  // turbopack root to this Next.js app directory to avoid warnings
  // when multiple lockfiles exist in the repo.
  turbopack: { root: './' },
};

// Wrap with next-pwa if available
try {
  const withPWA = (await import('next-pwa')).default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'clarion-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  });
  nextConfig = withPWA(nextConfig);
} catch {
  // next-pwa not installed yet - run: npm install next-pwa
  console.log('PWA plugin not found. Run: npm install next-pwa');
}

export default nextConfig;
