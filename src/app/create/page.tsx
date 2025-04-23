'use client'

import CreateIntro from './components/createInfo'
import CreateForm from './components/createForm'

export default function CreatePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-10 py-16 space-y-10">
      <div className="flex flex-col w-full max-w-3xl space-y-15">
      <CreateIntro />
      <CreateForm />
      </div>
    </div>
  )
}
