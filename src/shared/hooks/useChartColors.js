import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

const readCssVar = (name) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw})` : null;
};

export const useChartColors = () => {
  const { theme, resolvedMode } = useTheme();

  return useMemo(() => [
    readCssVar('--c-primary-500'),
    readCssVar('--c-secondary-500'),
    readCssVar('--c-primary-300'),
    readCssVar('--c-secondary-300'),
    readCssVar('--c-primary-700'),
    readCssVar('--c-secondary-700'),
  ].filter(Boolean), [theme, resolvedMode]);
};
