'use client'


import { useEffect } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function HomePage() {
 
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-10 py-16 space-y-10">

      
      {/* 제목 + 반짝이 */}
      <div className="relative w-fit mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold font-cute tracking-wide leading-tight text-[#5a3d1e] drop-shadow-md animate-fade-in-down text-center dark:text-white">
  Custom Schedule
</h1>

      </div>

      {/* 설명 */}
      <p className="text-gray-600 text-center text-base md:text-lg font-cute max-w-xl leading-relaxed dark:text-gray-100">
        당직표를 직접 만드는 일 생각보다 번거롭고 시간이 걸리죠. <br />
        그래서 준비했어요. <br />
        누구나 쉽게, 단 몇 분이면 <br />
        <strong className="text-[#5a3d1e] dark:text-amber-300" >맞춤 당직표를 자동으로 완성할 수 있어요.</strong>
        <br />
        <br />
        선생님의 소중한 시간을 아껴드릴게요. <br />
        하루가 조금 더 가벼워지고, 마음엔 여유가 피어나길 바랍니다. 🍀
      </p>

      {/* 이미지 */}
      <div className="shadow-xl rounded-xl overflow-hidden border border-purple-100">
        <Image
          src="/images/mainImg.png"
          alt="귀여운 당직표 이미지"
          width={600}
          height={400}
          className="object-cover"
        />
      </div>

     
        {/* 광고 영역 - 보이도록 수정 */}
        <div className="w-full max-w-2xl px-4 md:px-0">
        <div id="kakao-ad" className="flex justify-center items-center h-24 md:h-32">
          <ins
            className="kakao_ad_area"
            data-ad-unit="DAN-loD8LggbbgKOeb4m"
            data-ad-width="728"
            data-ad-height="90"
            style={{ display: 'block' }}
          ></ins>
        </div>
      </div>

     {/* 버튼 + 문구 */}
      <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-xl mt-6 space-y-4 md:space-y-0 animate-fade-in-up">
  
     {/* 문구 - 왼쪽 정렬 */}
      <p className="text-lg font-semibold text-center md:text-left font-cute">
        Ready? Let’s continue! 🚀
      </p>

      {/* 버튼 그룹 - 오른쪽 정렬 */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        <Link href="/create">
          <button    className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbc4ab] text-[#5a3d1e] font-semibold shadow-sm hover:bg-[#f6a28c] hover:shadow-md transition-all duration-300 whitespace-nowrap  dark:text-white">
            생성하기
          </button>
        </Link>
        <Link href="/input">
          <button className="border border-black text-black py-2 px-6 rounded-full hover:bg-amber-200 hover:text-black hover:scale-105 transition-all duration-300 ease-in-out dark:text-white">
            추천하기
          </button>
        </Link>
      </div>
    </div>
        </div> // ✅ 전체 return 닫기
      )
}