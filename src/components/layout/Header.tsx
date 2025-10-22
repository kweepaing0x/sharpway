import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <>
      <header className="bg-theme-header shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                type="button"
                className="px-4 border-r border-theme text-theme-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                onClick={onMenuClick}
              >
                <span className="sr-only">Open sidebar</span>
                      className="max-w-xs bg-theme-card rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              </button>
              <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-theme-tertiary" aria-hidden="true" />
                    </div>
                    <input
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-theme rounded-md leading-5 bg-theme-input placeholder-theme-tertiary text-theme-primary focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors duration-200 mr-2"
                aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
              >
                {currentTheme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              <button
                type="button"
                className="ml-4 p-2 text-theme-secondary hover:text-theme-primary"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-4 flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {user?.email?.substring(0, 1).toUpperCase() || 'A'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <button
                    type="button"
                    className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu-button"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.email || 'Admin User'}
                      </span>
                      <button 
                        onClick={signOut}
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        Sign out
                      </button>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
