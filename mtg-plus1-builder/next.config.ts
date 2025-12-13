import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // ポップアップとの通信を許可する設定
          },
        ],
      },
    ];
  },
};

export default nextConfig;
