import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initial check moved to useEffect to avoid layout forcing in first render
    const savedTheme = localStorage.getItem('theme');
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(shouldUseDark);
  }, []);

  useEffect(() => {
    // We only apply changes AFTER the initial mount has happened and isDarkMode is set
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 flex items-center justify-center size-10"
      style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}
      aria-label="Toggle Theme"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDarkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
