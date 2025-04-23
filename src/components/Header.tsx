import Link from 'next/link'

export function Header() {
    return  (
      <header className="fixed top-0 left-0 w-full bg-white/60 backdrop-blur-md shadow-md z-50 flex items-center justify-between px-6 py-4 border-b border-white/30">
        <Link href="/" className="text-xl font-bold text-[#5a3d1e] tracking-wide drop-shadow-sm">
          Custom Schedule
        </Link>
        <div className="space-x-4">
          <a href="/info" className="text-[#5a3d1e] hover:underline hover:text-[#3e2a12] transition-colors">
            info
          </a>
          <button className="text-[#5a3d1e] border border-[#5a3d1e] py-1 px-4 rounded-full hover:bg-white/40 transition">
            로그인
          </button>
        </div>
      </header>
    );
  }