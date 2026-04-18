import { useMediaQuery } from './useMediaQuery';

export function useWideGrid() {
  return useMediaQuery('(min-width: 1440px)');
}

export function useDesktop() {
  return useMediaQuery('(min-width: 768px)');
}
