import { useTheme } from '../../contexts/theme-context'

interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DarkModeToggle({ size = 'md', className = '' }: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-5',
    md: 'w-11 h-6', 
    lg: 'w-14 h-7'
  }

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const translateClasses = {
    sm: isDarkMode ? 'translate-x-4' : 'translate-x-1',
    md: isDarkMode ? 'translate-x-6' : 'translate-x-1', 
    lg: isDarkMode ? 'translate-x-8' : 'translate-x-1'
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isDarkMode ? 'bg-primary' : 'bg-muted'
      } ${sizeClasses[size]} ${className}`}
      role="switch"
      aria-checked={isDarkMode}
      aria-label="Toggle dark mode"
    >
      <span
        className={`inline-block ${thumbSizeClasses[size]} rounded-full bg-background shadow-lg transform transition duration-200 ease-in-out ${translateClasses[size]}`}
      />
      
      {/* Sun/Moon icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        {/* Sun icon (left side, visible in light mode) */}
        <svg
          className={`w-3 h-3 text-yellow-500 transition-opacity duration-200 ${
            isDarkMode ? 'opacity-0' : 'opacity-100'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Moon icon (right side, visible in dark mode) */}
        <svg
          className={`w-3 h-3 text-primary/60 transition-opacity duration-200 ${
            isDarkMode ? 'opacity-100' : 'opacity-0'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  )
}