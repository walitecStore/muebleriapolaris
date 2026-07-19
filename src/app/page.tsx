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

export const metadata: Metadata = {
  title: 'Mueblería Polaris — Sofás de Calidad para tu Hogar',
  description: 'Colección exclusiva de sofás modernos, clásicos y de diseño. Compra fácil por WhatsApp, envío gratis y garantía 2 años. Más de 50 modelos disponibles.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mueblería Polaris — Sofás de Calidad',
    description: 'Descubre nuestra colección de sofás premium. Compra por WhatsApp.',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FurnitureStore',
            name: 'Mueblería Polaris',
            description: 'Sofás de calidad para tu hogar. Más de 50 modelos disponibles.',
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
        <FeaturedSection />
        <CatalogSection />
        <AboutSection />
        <TestimonialsSection />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}