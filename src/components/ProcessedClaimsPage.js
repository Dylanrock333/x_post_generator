import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/ProcessedClaimsPage.css';
import VideoInfoDisplay from './VideoInfoDisplay';
import { generatePost } from '../api/api';

const ProcessedClaimsPage = () => {
  const location = useLocation();
  const { processedClaims = [], videoData, videoUrl } = location.state || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  const [generationError, setGenerationError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [copiedSections, setCopiedSections] = useState({});

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(videoUrl).then(() => {
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 2000);
    });
  };

  const handleCopySection = (sectionIndex, sectionContent) => {
    navigator.clipboard.writeText(sectionContent).then(() => {
      setCopiedSections(prev => ({ ...prev, [sectionIndex]: true }));
      setTimeout(() => {
        setCopiedSections(prev => ({ ...prev, [sectionIndex]: false }));
      }, 2000);
    });
  };

  const parseGeneratedPost = (postContent) => {
    if (!postContent) return [];
    
    // Split by *** or --- and filter out empty sections
    const sections = postContent
      .split(/\*\*\*|---/)
      .map(section => section.trim())
      .filter(section => section.length > 0);
    
    return sections;
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setGeneratedPost('');
    setGenerationError(null);

    try {
      const response = await generatePost({
        selectedClaims: processedClaims,
        videoData: videoData,
        prompt: customPrompt,
      });
      setGeneratedPost(response);
    } catch (error) {
      setGenerationError(error.message || 'Failed to generate post.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (processedClaims.length === 0) {
    return (
      <div className="processed-claims-page">
        <div className="container">
          <h2>No claims to display.</h2>
          <p>Please go back and select some claims to process.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="processed-claims-page">
      <div className="container">
        <VideoInfoDisplay videoData={videoData} />
        <h2>Processed Claims</h2>
        <div className="claims-container">
          {processedClaims.map((claim, index) => (
            <div key={claim.id} className="claim-card">
              <h4>{index + 1}. {claim.title}</h4>
              <blockquote className="claim-quote">"{claim.quote}"</blockquote>
              <p className="claim-context"><strong>Context:</strong> {claim.context}</p>
              <div className="claim-meta">
                <span><strong>Timestamp:</strong> {claim.timestamp}</span>
                <span><strong>Category:</strong> {claim.category}</span>
                <span><strong>Controversy Score:</strong> {claim.controversy_score}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="generation-section">
          <div className="prompt-container">
            <label htmlFor="customPrompt">Your Prompt:</label>
            <textarea
              id="customPrompt"
              className="prompt-textarea"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Write a Twitter thread about the most surprising facts from this video..."
              rows="6"
              disabled={isGenerating}
            ></textarea>
          </div>
          <button 
            onClick={handleGeneratePost} 
            disabled={isGenerating || !customPrompt.trim()}
            className="generate-post-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Post'}
          </button>

          {isGenerating && <p className="generating-text">Communicating with the AI, please wait...</p>}
          
          {generationError && <div className="error-message">{generationError}</div>}
          
          {generatedPost && (
            <div className="generated-post-container">
              <h3>Generated Post:</h3>
              <div className="source-url-container">
                <label htmlFor="videoUrl">Source Video URL:</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    id="videoUrl"
                    value={videoUrl} 
                    readOnly 
                    className="source-url-input"
                  />
                  <button onClick={handleCopyUrl} className="copy-url-button" title="Copy URL">
                    {isUrlCopied ? 'Copied!' : <i className="fas fa-copy"></i>}
                  </button>
                </div>
              </div>
              <div className="post-sections">
                {parseGeneratedPost(generatedPost).map((section, index) => (
                  <div key={index} className="post-section">
                    <div className="section-header">
                      <label>Section {index + 1}:</label>
                      <button 
                        onClick={() => handleCopySection(index, section)} 
                        className="copy-section-button" 
                        title="Copy Section"
                      >
                        {copiedSections[index] ? 'Copied!' : <i className="fas fa-copy"></i>}
                      </button>
                    </div>
                    <textarea
                      value={section}
                      readOnly
                      className="post-section-textarea"
                      rows={Math.min(Math.max(section.split('\n').length, 11), 25)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessedClaimsPage; 