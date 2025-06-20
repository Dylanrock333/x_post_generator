import React from 'react';
import VideoInput from '../components/VideoInput';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <main className="main-content">
        <div className="hero-section">
          <h1>YouTube Fact Checker</h1>
          <p>Verify information from YouTube videos with AI-powered fact checking</p>
        </div>
        <VideoInput />
      </main>
    </div>
  );
};

export default HomePage; 