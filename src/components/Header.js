import React from 'react';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h2>🎯 X Post Generator</h2>
        </div>
        <nav className="nav">
          <ul>
            <li><a href="/">Home</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 