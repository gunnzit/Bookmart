import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets the dev server's scripts load when the site is opened from
  // a phone through the tunnel or the Wi-Fi address. Has no effect on the live site.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.18.31"],

  // Old domain → new domain, same page. /api is left alone so webhooks that
  // still point at pageplus.in (Meta, Razorpay) keep working until they are moved.
  async redirects() {
    return ["pageplus.in", "www.pageplus.in", "www.wrapandread.in"].map((host) => ({
      source: "/:path((?!api/).*)",
      has: [{ type: "host" as const, value: host }],
      destination: "https://wrapandread.in/:path",
      permanent: true,
    }));
  },
};

export default nextConfig;
