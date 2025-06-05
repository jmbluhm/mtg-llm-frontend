'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('mtg-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mtg-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        // Moon icon for dark mode
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path d="m12 1-1.5 1.5L12 4l1.5-1.5L12 1zM21 11.5a1.5 1.5 0 0 1 0 3h-1.5l1.5-1.5-1.5-1.5H21zM1 11.5a1.5 1.5 0 0 1 0 3h1.5L1 13l1.5-1.5H1zM12 20l1.5 1.5L12 23l-1.5-1.5L12 20zM20.5 20.5 19 19l1.5-1.5 1.5 1.5-1.5 1.5zM20.5 3.5 19 5l1.5 1.5-1.5 1.5 1.5-1.5zM3.5 20.5 5 19l-1.5-1.5-1.5 1.5 1.5 1.5zM3.5 3.5 5 5l-1.5 1.5 1.5 1.5-1.5-1.5z" />
        </svg>
      )}
    </button>
  );
} 