import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Stats } from "@/components/sections/Stats";
import { Features } from "@/components/sections/Features";
import { Demo } from "@/components/sections/Demo";
import { Sectors } from "@/components/sections/Sectors";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function HomePage() {
  return (
    <div className="surface-light bg-paper text-inkl">
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <HowItWorks />
        <Demo />
        <Features />
        <Stats />
        <Sectors />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
