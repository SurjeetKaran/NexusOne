import React, { useEffect, useState } from "react";
import ParticlesBackground from "../../../components/shared/ParticlesBackground";
import LandingNavbar from "./LandingNavbar";
import MobileMenu from "./MobileMenu";
import HeroSection from "./sections/HeroSection";
import HowSection from "./sections/HowSection";
import TrialSection from "./sections/TrialSection";
import UsersSection from "./sections/UsersSection";
import MultimodalSection from "./sections/MultimodalSection";
import ModulesSection from "./sections/ModulesSection";
import FeaturesSection from "./sections/FeaturesSection";
import PricingSection from "./sections/PricingSection";
import FAQSection from "./sections/FAQSection";
import FooterSection from "./sections/FooterSection";
import {
  FAQS,
  HERO_BADGE_ICON,
  HOW_IT_WORKS,
  MODULES,
  MULTIMODAL,
  NAV_ITEMS,
  PLATFORM_FEATURES,
  SECTIONS,
  TRIAL_STEPS,
  USER_TYPES,
} from "./data";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (const id of SECTIONS) {
        const sec = document.getElementById(id);
        if (!sec) continue;
        if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
          setActiveSection(id);
          break;
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-text-strong bg-transparent font-body selection:bg-electric-500/30">
      <div className="pointer-events-none absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_14%_12%,var(--landing-glow-1),transparent_28%),radial-gradient(circle_at_88%_10%,var(--landing-glow-2),transparent_34%),radial-gradient(circle_at_54%_84%,var(--landing-glow-3),transparent_30%)]" />
      <ParticlesBackground />

      <LandingNavbar
        navItems={NAV_ITEMS}
        activeSection={activeSection}
        onNavClick={handleNavClick}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <MobileMenu
        open={isMenuOpen}
        navItems={NAV_ITEMS}
        onClose={() => setIsMenuOpen(false)}
        onNavClick={handleNavClick}
      />

      <div className="relative z-10 pt-20">
        <HeroSection onExplore={() => handleNavClick("how")} badgeIcon={HERO_BADGE_ICON} />
        <HowSection items={HOW_IT_WORKS} />
        <TrialSection steps={TRIAL_STEPS} />
        <UsersSection items={USER_TYPES} />
        <MultimodalSection items={MULTIMODAL} />
        <ModulesSection modules={MODULES} />
        <FeaturesSection features={PLATFORM_FEATURES} />
        <PricingSection />
        <FAQSection items={FAQS} expandedFAQ={expandedFAQ} setExpandedFAQ={setExpandedFAQ} />
        <FooterSection />
      </div>
    </div>
  );
}
