"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp"
import {
  HeaderHero,
  HowItWorks,
  WhyChooseFX,
  ContactUs,
  CTAFooter,
  Footer
} from "@/components/landing"

export default function LandingPage() {
  const router = useRouter()
  const { isMiniApp } = useFarcasterMiniApp()

  useEffect(() => {
    const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay
    if (isMiniApp || isMiniPay) {
      router.replace("/send")
    }
  }, [isMiniApp, router])

  return (
    <div className="min-h-screen">
      <HeaderHero />
      <HowItWorks />
      <WhyChooseFX />
      <ContactUs />
      <CTAFooter />
      <Footer />
    </div>
  )
}