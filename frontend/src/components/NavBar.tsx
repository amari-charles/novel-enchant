/**
 * Clean, Minimal Navigation Bar
 * Based on 2024 design research from Navbar Gallery, Dribbble patterns
 * Simple typography, proper spacing, subtle interactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';

interface NavBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentRoute, onNavigate }) => {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isActive = (route: string) => currentRoute === route;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-background border-b border-border/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => onNavigate('upload')}
            className="text-xl font-semibold text-foreground hover:opacity-80 transition-opacity"
          >
            Novel Enchant
          </button>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('explore')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                isActive('explore')
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('stories')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                isActive('stories')
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              My Stories
            </button>
          </div>

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50"
            >
              <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs font-medium text-foreground">
                {getUserInitials()}
              </div>
              <span className="hidden sm:block">{user?.email}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/20 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border/20">
                  <p className="text-sm text-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-1">
            <button
              onClick={() => onNavigate('explore')}
              className={`text-xs px-2 py-1 rounded ${
                isActive('explore') ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('stories')}
              className={`text-xs px-2 py-1 rounded ${
                isActive('stories') ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              Stories
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;