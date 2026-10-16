import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets the dev server's scripts load when the site is opened from
  // a phone through the tunnel or the Wi-Fi address. Has no effect on the live site.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.18.31"],
};

export default nextConfig;