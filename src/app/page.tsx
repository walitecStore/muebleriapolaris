import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import BenefitsBar from './components/BenefitsBar';
import FeaturedSection from './components/FeaturedSection';
import CatalogSection from './components/CatalogSection';
import AboutSection from './components/AboutSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactCTA from './components/ContactCTA';
import RouletteSection from './components/RouletteSection';
import RoomsSection from './components/RoomsSection';
import InspirationSection from './components/InspirationSection';

export const metadata: Metadata = {
  title: 'Muebler\u00eda Polaris | Muebles para tu hogar',
  description:
    'Muebles para sala, comedor, dormitorio, oficina y decoraci\u00f3n. Compra f\u00e1cil y recibe asesor\u00eda personalizada.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Muebler\u00eda Polaris | Muebles para tu hogar',
    description:
      'Muebles para sala, comedor, dormitorio, oficina y decoraci\u00f3n. Compra f\u00e1cil y recibe asesor\u00eda personalizada.',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
  },
};
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FurnitureStore',
            name: 'Mueblería Polaris',
            description:
              'Muebles para sala, comedor, dormitorio, oficina y decoraci\u00f3n. Compra f\u00e1cil y recibe asesor\u00eda personalizada.',
            url: 'https://muebleriapolaris.com',
            telephone: '+15550000000',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Av. Principal 123, Local 45',
              addressLocality: 'Ciudad',
            },
            openingHours: ['Mo-Fr 09:00-19:00', 'Sa 09:00-17:00', 'Su 10:00-15:00'],
            sameAs: [],
          }),
        }}
      />
      <Header />
      <main>
        <HeroSection />
        <BenefitsBar />
        <RoomsSection />
        <InspirationSection />
        <FeaturedSection />
        <CatalogSection />
        <AboutSection />
        <TestimonialsSection />
        <RouletteSection />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
