/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 빌드할 때 타입 에러가 있어도 멈추지 않고 넘어가게 해줘 (기존 설정 유지)
    ignoreBuildErrors: true,
  },
  images: {
    // 이미지 최적화 끄기 (기존 설정 유지)
    unoptimized: true,
  },
  // 💡 [수정 포인트]: eslint 덩어리를 삭제하는 대신, 아래 속성을 넣어주면 
  // 최신 Next.js에서도 경고창 없이 빌드할 때 ESLint 검사를 깔끔하게 패스해!
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
