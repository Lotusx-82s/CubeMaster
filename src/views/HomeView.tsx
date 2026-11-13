import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeatureGrid from '../components/home/FeatureGrid';
import PuzzleTypesShowcase from '../components/home/PuzzleTypesShowcase';
import HowItWorks from '../components/home/HowItWorks';

export const HomeView: React.FC = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <FeatureGrid />
      <PuzzleTypesShowcase />
      <HowItWorks />
    </div>
  );
};

export default HomeView;
