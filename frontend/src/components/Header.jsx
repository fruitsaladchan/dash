import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

function Header({ title, darkMode, setDarkMode, stats }) {
  return (
    <div className="header">
      <h1>{title}</h1>
      <div className="header-right">
        <button
          className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        <div className="datetime">
          <span>{stats?.date}</span>
          <span>{stats?.time}</span>
        </div>
      </div>
    </div>
  );
}

export default Header; 