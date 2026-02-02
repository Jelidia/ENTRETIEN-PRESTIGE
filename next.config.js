const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost = null;

if (supabaseUrl) {
  try {
    supabaseHost = new URL(supabaseUrl).hostname;
  } catch (error) {
    supabaseHost = null;
  }
}

const imageDomains = ["images.unsplash.com", "cdn.twilio.com"];

if (supabaseHost) {
  imageDomains.push(supabaseHost);
}

const cspImgSrc = [
  "'self'",
  "data:",
  "https://images.unsplash.com",
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
  supabaseHost ? `https://${supabaseHost}` : null,
].filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: imageDomains,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src ${cspImgSrc.join(" ")}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.stripe.com https://api.resend.com https://api.twilio.com https://maps.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
