import { useTheme } from './hooks/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

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
