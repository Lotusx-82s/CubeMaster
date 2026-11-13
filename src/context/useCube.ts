import { useContext } from 'react';
import { CubeContext } from './cubeContextInstance';
import type { CubeContextType } from './cubeContextInstance';

export const useCube = (): CubeContextType => {
  const context = useContext(CubeContext);
  if (!context) {
    throw new Error('useCube must be used within a CubeProvider');
  }
  return context;
};

export default useCube;
