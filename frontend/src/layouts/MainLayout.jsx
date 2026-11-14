import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout = () => {
  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <svg className="glass-filter-defs" aria-hidden="true" focusable="false" width="0" height="0">
        <filter id="glass-refraction" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <Navbar />
      <main className="site-main" style={{ flex: 1, padding: '2rem 0 4rem 0' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

