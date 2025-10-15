"use client"

import {
  HeaderHero,
  HowItWorks,
  WhyChooseFX,
  ContactUs,
  CTAFooter,
  Footer
} from "@/components/landing"
import { FarcasterStatus } from "@/components/FarcasterStatus"
import { FarcasterDebug } from "@/components/FarcasterDebug"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <FarcasterStatus />
      <FarcasterDebug />
      <HeaderHero />
      <HowItWorks />
      <WhyChooseFX />
      <ContactUs />
      <CTAFooter />
      <Footer />
    </div>
  )
}