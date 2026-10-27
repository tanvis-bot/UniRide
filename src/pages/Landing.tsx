import React from 'react';
import { Hero } from '../components/landing/Hero';
import { StatsStrip } from '../components/landing/StatsStrip';
import { StepsSection } from '../components/landing/StepsSection';
import { SafetySection } from '../components/landing/SafetySection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { SustainabilitySection } from '../components/landing/SustainabilitySection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CtaSection } from '../components/landing/CtaSection';

export function Landing() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <StepsSection />
      <SafetySection />
      <BenefitsSection />
      <SustainabilitySection />
      <TestimonialsSection />
      <CtaSection />
    </>);

}