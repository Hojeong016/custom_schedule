'use client'

export default function CreateIntro() {
  return  (
    <div className="flex flex-col space-y-6">
    <h1 className="text-2xl md:text-4xl font-bold text-[#5a3d1e] tracking-wide drop-shadow-sm animate-fade-in-down text-left">
      당직 정보를 입력해주세요.
    </h1>

    <p className="text-[#9f7150] text-base md:text-lg tracking-normal drop-shadow-sm animate-fade-in-up text-left leading-relaxed">
      교사 이름과 연차 정보를 입력해 주세요. <br />
      입력된 내용은 저장되지 않으며, 오직 당직표 생성을 위해 사용됩니다.
    </p>
  </div>
  )
}
