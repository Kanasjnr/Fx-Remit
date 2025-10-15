"use client"

import {
  HeaderHero,
  HowItWorks,
  WhyChooseFX,
  // ContactUs,
  CTAFooter,
  Footer
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeaderHero />
      <HowItWorks />
      <WhyChooseFX />
      {/* <ContactUs /> */}
      <CTAFooter />
      <Footer />
    </div>
  )
}