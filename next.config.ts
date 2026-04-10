import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 빌드 시 타입 체크 오류를 무시함
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 오류를 무시함
    ignoreDuringBuilds: true,
  },
  images: {
    // 이미지 최적화 경고 방지
    unoptimized: true,
  },
};

export default nextConfig;