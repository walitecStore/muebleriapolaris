import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import BenefitsBar from './components/BenefitsBar';
import FeaturedSection from './components/FeaturedSection';
import CatalogSection from './components/CatalogSection';
import AboutSection from './components/AboutSection';
import ContactCTA from './components/ContactCTA';
import Discovery from '@/components/Discovery';
import DailyWheel from '@/components/DailyWheel';
import PromotionWelcome from '@/components/PromotionWelcome';
import RoomsSection from './components/RoomsSection';
import InspirationSection from './components/InspirationSection';

export const metadata: Metadata = {
  title: 'Polaris | Compra y vende',
  description:
    'Muebles para sala, comedor, dormitorio, oficina y decoraci\u00f3n. Compra f\u00e1cil y recibe asesor\u00eda personalizada.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Polaris | Compra y vende',
    description:
      'Muebles para sala, comedor, dormitorio, oficina y decoraci\u00f3n. Compra f\u00e1cil y recibe asesor\u00eda personalizada.',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
  },
};
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <BenefitsBar />
        <RoomsSection />
        <InspirationSection />
        <PromotionWelcome />
        <Discovery />
        <FeaturedSection />
        <DailyWheel />
        <CatalogSection />
        <AboutSection />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
