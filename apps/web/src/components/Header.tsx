'use client';

import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">NOTMAT</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/note/new"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              New Note
            </Link>
            <DarkModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
