import React from 'react';
import HeroSection from '../components/home/HeroSection';
import InputSelectionSection from '../components/home/InputSelectionSection';
import PuzzleTypesShowcase from '../components/home/PuzzleTypesShowcase';
import FeatureGrid from '../components/home/FeatureGrid';
import HowItWorks from '../components/home/HowItWorks';

export const HomeView: React.FC = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <InputSelectionSection />
      <PuzzleTypesShowcase />
      <FeatureGrid />
      <HowItWorks />
    </div>
  );
};

export default HomeView;
