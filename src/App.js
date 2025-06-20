import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProcessedClaimsPage from './components/ProcessedClaimsPage';
import Header from './components/Header';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/process" element={<ProcessedClaimsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 