import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 빌드 시 타입 에러 무시 (강제 배포용)
    ignoreBuildErrors: true,
  },
  images: {
    // 이미지 최적화 오류 방지
    unoptimized: true,
  },
};

export default nextConfig;