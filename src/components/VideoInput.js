import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VideoInput.css';
import { validateUrl } from '../utils/urlDecoder';
import { analyzeVideoWithProgress } from '../api/api';
import { processAnalysisData } from '../utils/dataProcessor';
import AnalysisResultDisplay from './AnalysisResultDisplay';
import VideoInfoDisplay from './VideoInfoDisplay';

const VideoInput = () => {
  const [videoUrl, setVideoUrl] = useState(() => localStorage.getItem('videoUrl_input') || '');
  const [origin, setOrigin] = useState('');
  const [videoID, setVideoID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(() => {
    const saved = localStorage.getItem('analysisData');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);
  const [percentage, setPercentage] = useState(0);
  const [selectedClaims, setSelectedClaims] = useState(() => {
    const saved = localStorage.getItem('selectedClaims');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('videoUrl_input', videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    if (analysisData) {
      localStorage.setItem('analysisData', JSON.stringify(analysisData));
    } else {
      localStorage.removeItem('analysisData');
    }
  }, [analysisData]);

  useEffect(() => {
    localStorage.setItem('selectedClaims', JSON.stringify(selectedClaims));
  }, [selectedClaims]);

  const handleClaimSelection = (claimId, isSelected) => {
    setSelectedClaims(prevSelected => {
        if (isSelected) {
            return [...prevSelected, claimId];
        } else {
            return prevSelected.filter(id => id !== claimId);
        }
    });
  };

  const handleSelectAll = () => {
    if (!analysisData || !analysisData.claims) return;

    const allClaimIds = analysisData.claims.map(claim => claim.id);
    const allSelected = selectedClaims.length === allClaimIds.length;

    if (allSelected) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(allClaimIds);
    }
  };

  const handleProcessClaims = () => {
    if (!analysisData || !analysisData.claims) return;
    
    const claimsToProcess = analysisData.claims.filter(claim => selectedClaims.includes(claim.id));
    navigate('/process', { 
      state: { 
        processedClaims: claimsToProcess,
        videoData: analysisData.video_data,
        videoUrl: videoUrl,
        videoID: videoID
      } 
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim() || isLoading) return;

    setIsLoading(true);
    setAnalysisData(null);
    setSelectedClaims([]);
    setError(null);
    setPercentage(0);

    let validationResult;
    try {
      validationResult = validateUrl(videoUrl);
      
      // Save all three variables: origin, videoID, and url
      setOrigin(validationResult.origin);
      setVideoID(validationResult.videoID);
      
    } catch (error) {
      setError("Invalid URL format.");
      setIsLoading(false);
      return;
    }

    setPercentage(5);

    const payload = {
        url: videoUrl,
        origin: validationResult.origin,
        videoID: validationResult.videoID,
        selectedLanguage: 'en'
    };

    const callbacks = {
        onProgress: (progressUpdate) => {
            console.log('Progress:', progressUpdate);
            setPercentage(prev => progressUpdate.percentage > prev ? progressUpdate.percentage : prev);
        },
        onComplete: (result) => {
            console.log('Analysis Complete:', result);
            const processedData = processAnalysisData(result);
            setAnalysisData(processedData);
            setPercentage(100);
            setTimeout(() => setIsLoading(false), 500);
        },
        onError: (err) => {
            console.error('Analysis Error:', err);
            setError(err.message || 'An error occurred during analysis.');
            setIsLoading(false);
        }
    };

    analyzeVideoWithProgress(payload, callbacks);
  };

  return (
    <div className="video-input-section">
      <form onSubmit={handleSubmit} className="video-input-form">
        <div className="input-group">
          <input
            type="url"
            placeholder="Enter YouTube video URL..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="video-url-input"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="check-button"
            disabled={isLoading || !videoUrl.trim()}
          >
            {isLoading ? 'Analyzing...' : 'Check Facts'}
          </button>
        </div>
      </form>
      
      {isLoading && (
        <div className="analysis-loading">
          <p>Analyzing... {percentage}%</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {analysisData && !isLoading && (
        <>
          <VideoInfoDisplay videoData={analysisData.video_data} videoID={videoID} />
          
          <div className="claims-actions">
            <button onClick={handleSelectAll} className="select-all-button">
              {analysisData.claims && analysisData.claims.length === selectedClaims.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <AnalysisResultDisplay 
            analysisData={analysisData}
            onClaimSelect={handleClaimSelection}
            selectedClaims={selectedClaims}
          />
          {selectedClaims.length > 0 && (
            <button onClick={handleProcessClaims} className="process-claims-button">
                Process {selectedClaims.length} Claim(s)
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default VideoInput; 