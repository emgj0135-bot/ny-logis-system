import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. 용차업체 시스템에서 보낸 배차 데이터 받기
    const dispatchData = await request.json();
    
    // 용차업체가 보내주는 실제 데이터 필드명에 맞게 나중에 수정해야 할 수 있어!
    // 일단 기본 예시 필드로 짜둘게.
    const { carNumber, driverPhone, route, price, memo } = dispatchData;

    // 2. 갱미가 보내준 잔디 웹훅 주소로 보낼 데이터 가공
    const jandiPayload = {
      body: "🚚 **새로운 배차 정보가 등록되었습니다!**",
      connectColor: "#00C73C", // 잔디 메시지 옆 테두리 색상 (초록색)
      connectInfo: [
        {
          title: "운행 구간",
          description: route || "정보 없음"
        },
        {
          title: "차량 번호",
          description: carNumber || "정보 없음"
        },
        {
          title: "기사님 연락처",
          description: driverPhone || "정보 없음"
        },
        {
          title: "운송료",
          description: price ? `${Number(price).toLocaleString()}원` : "정보 없음"
        },
        {
          title: "요청/비고 사항",
          description: memo || "없음"
        }
      ]
    };

    // 3. 갱미의 잔디 서버로 데이터 진짜로 쏘기
    const JANDI_WEBHOOK_URL = 'https://wh.jandi.com/connect-api/webhook/20920922/df3da1f2eff77177abf9cbfbf0d0223c'; 
    
    const jandiResponse = await fetch(JANDI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.tosslab.jandi-v2+json' // 잔디 필수 규격 헤더
      },
      body: JSON.stringify(jandiPayload)
    });

    if (!jandiResponse.ok) {
      throw new Error('잔디 웹훅 전송 실패');
    }

    return NextResponse.json({ success: true, message: "잔디로 신호 전달 성공!" }, { status: 200 });

  } catch (error: any) {
    console.error("웹훅 처리 중 에러 발생:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
