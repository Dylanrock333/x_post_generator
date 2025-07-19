import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/ProcessedClaimsPage.css';
import VideoInfoDisplay from './VideoInfoDisplay';
import { generatePost } from '../api/api';

const ProcessedClaimsPage = () => {
  const location = useLocation();

  const [processedClaims, setProcessedClaims] = useState(() => {
    const fromState = location.state?.processedClaims;
    if (fromState && fromState.length > 0) {
      localStorage.setItem('processedClaims', JSON.stringify(fromState));
      return fromState;
    }
    const fromStorage = localStorage.getItem('processedClaims');
    return fromStorage ? JSON.parse(fromStorage) : [];
  });

  const [videoData, setVideoData] = useState(() => {
    const fromState = location.state?.videoData;
    if (fromState) {
      localStorage.setItem('videoData', JSON.stringify(fromState));
      return fromState;
    }
    const fromStorage = localStorage.getItem('videoData');
    return fromStorage ? JSON.parse(fromStorage) : null;
  });

  const [videoUrl, setVideoUrl] = useState(() => {
    const fromState = location.state?.videoUrl;
    if (fromState) {
      localStorage.setItem('videoUrl', fromState);
      return fromState;
    }
    return localStorage.getItem('videoUrl') || '';
  });

  const [videoID, setVideoID] = useState(() => {
    const fromState = location.state?.videoID;
    if (fromState) {
      localStorage.setItem('videoID', fromState);
      return fromState;
    }
    return localStorage.getItem('videoID') || '';
  });

  useEffect(() => {
    if (location.state) {
      if (location.state.processedClaims) {
        setProcessedClaims(location.state.processedClaims);
        localStorage.setItem('processedClaims', JSON.stringify(location.state.processedClaims));
      }
      if (location.state.videoData) {
        setVideoData(location.state.videoData);
        localStorage.setItem('videoData', JSON.stringify(location.state.videoData));
      }
      if (location.state.videoUrl) {
        setVideoUrl(location.state.videoUrl);
        localStorage.setItem('videoUrl', location.state.videoUrl);
      }
      if (location.state.videoID) {
        setVideoID(location.state.videoID);
        localStorage.setItem('videoID', location.state.videoID);
      }
    }
  }, [location.state]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState(() => localStorage.getItem('generatedPost') || '');
  const [generationError, setGenerationError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState(() => localStorage.getItem('customPrompt') || '');
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isThumbnailCopied, setIsThumbnailCopied] = useState(false);
  const [copiedSections, setCopiedSections] = useState({});

  useEffect(() => {
    if (location.state?.processedClaims?.length > 0) {
      setGeneratedPost('');
      localStorage.removeItem('generatedPost');
      setCustomPrompt('');
      localStorage.removeItem('customPrompt');
    }
  }, [location.state?.processedClaims]);

  useEffect(() => {
    localStorage.setItem('generatedPost', generatedPost);
  }, [generatedPost]);

  useEffect(() => {
    localStorage.setItem('customPrompt', customPrompt);
  }, [customPrompt]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(videoUrl).then(() => {
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 2000);
    });
  };

  const handleCopyThumbnail = async () => {
    if (!videoData?.thumbnail) return;

    try {
      const response = await fetch(videoData.thumbnail);
      const jpegBlob = await response.blob();

      // Convert JPEG Blob to PNG Blob via canvas because PNG is more widely supported for clipboard writing
      const pngBlob = await new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const objectUrl = URL.createObjectURL(jpegBlob);

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
            URL.revokeObjectURL(objectUrl);
          }, 'image/png');
        };

        img.onerror = (err) => {
          reject(err);
          URL.revokeObjectURL(objectUrl);
        };
        
        img.src = objectUrl;
      });

      if (!pngBlob) {
        throw new Error("Canvas to Blob conversion failed");
      }

      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
      
      setIsThumbnailCopied(true);
      setTimeout(() => setIsThumbnailCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image: ", err);
      // You could add user-facing error handling here if desired
    }
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

  const constructFinalPrompt = (claims, videoData, videoID, userPrompt) => {
    // --- Construct a detailed prompt for Gemini ---
    const videoInfoParts = Object.entries(videoData || {}).map(([key, value]) => 
      `- ${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`
    );
    
    // Add video ID to the video information
    if (videoID) {
      videoInfoParts.unshift(`- Video ID: ${videoID}`);
    }
    
    const videoInfoStr = videoInfoParts.join('\n');
    
    const claimsStrParts = claims.map((claim, index) => {
      const claimDetails = [
        `  - Title: ${claim.title || 'N/A'}`,
        `  - Quote: "${claim.quote || 'N/A'}"`,
        `  - Context: "${claim.context || 'N/A'}"`,
        `  - Timestamp: ${claim.timestamp || 'N/A'}`,
        `  - Category: ${claim.category || 'N/A'}`,
        `  - Controversy Score: ${claim.controversy_score || 'N/A'}`,
        `  - Search Query: ${claim.search_query || 'N/A'}`
      ].join('\n');
      
      return `Claim ${index + 1}:\n${claimDetails}`;
    });
    const claimsStr = claimsStrParts.join('\n\n');

    // Combine all information into a single, comprehensive prompt
    const finalPrompt = `
You are an AI assistant tasked with generating twitter posts based on video content. 
Here is the information about the video and a set of claims extracted from it using my YouTube claim extractor app, that pulls the claims from the video transcript and formats them.
Use this context to generate a twitter post that is engaging and informative.
The following is information about the video and claims extracted from it.
Follow the user request if provided.

--- VIDEO INFORMATION ---
${videoInfoStr}

--- SELECTED CLAIMS FROM THE VIDEO ---
${claimsStr}

--- USER'S REQUEST THEMES OF THE POST ---
${userPrompt}
---

I want you to generate a twitter post and threads that is engaging.
I need a intro post that introduces the video, if there are people in the video, mention them. Make the first post give background of the video in an engaging way.
Select only the most interesting, informative and engaging points, topics, statements, or claims from this list of selected claims. You can combine or split up the claims to make the post more engaging and/or if they are related.
Each post should have a topic or point. The posts should stay on topic from the information from the video.
claims should be in the format of a thread with a number title and timestamp with the quote/claim and context to the quote.
Claim context should be descriptive and provide enough context to the quote.
Add a newline after each Title and Quote make sure the intro and outro posts is a bit shorter. Make sure the intro post has enough information so that a reader understands what the posts are about.
The final post that is a call to action to try my app videoclaimcatcher.com helps people evaluate and learn more about the video.
Post should be organized by timestamp. 

Here is an example of the format:

[START OF FORMAT]
1.*ONLY ONE EMOJI* THREAD_NUMBER TITLE (Timestamp)

quote

context to the quote
[END OF FORMAT]

Here is an example:
[START OF EXAMPLE]
---
🚨 Sam Altman just dropped a ton of 🔥 insights in the first episode of OpenAI's new podcast.

From AGI timelines and GPT-5 to social media mistakes, hallucinating AIs, and even giant compute facilities…

Here are 9 of the most interesting and surprising things he said 🧵👇
---
1. 🧠 AGI Yearly? (00:48)

"I think more and more people will think we've gotten to an AGI system every year."

Each year, AI improves so quickly that public perception is shifting. Altman suggests we may start declaring AGI annually — not because AI is AGI, but because the definition keeps moving forward.
---
...
---
9. ⚗️ AI & Drug Discovery (35:20)

"We already have existing drugs… but with a couple of small modifications, we are very close to something great."

Altman believes AI could unlock hidden uses of existing medicines — a silent revolution in pharma powered by large models and data reinterpretation.
---
🧠 Want to dig deeper into this interview?

Get an instant breakdown of claims, quotes, and key insights — all from this exact video.
🔗 https://videoclaimcatcher.com/analysis-page?videoID=[VIDEO_ID_HERE]

Or analyze any YouTube video at
🌐 https://videoclaimcatcher.com

Perfect for researchers, journalists, educators, and curious minds. Try it free.
[END OF EXAMPLE]

Try to keep the outro post short and concise.
The post should match the themes and intesity of the video and claims.
Highlight that users can instantly explore the key quotes, arguments, and hidden insights from that video. 
Use clear, friendly language — avoid vague terms like 'claims' unless paired with more concrete words like 'quotes' or 'key points.' 
Emphasize speed, simplicity, and curiosity. Tone should be helpful, smart, and curiosity-driven."
    `;
    
    return finalPrompt;
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setGeneratedPost('');
    setGenerationError(null);

    try {
      // Construct the final prompt on the frontend
      const finalPrompt = constructFinalPrompt(processedClaims, videoData, videoID, customPrompt);
      
      const response = await generatePost({
        prompt: finalPrompt,
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
        <VideoInfoDisplay videoData={videoData} videoID={videoID} />
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
              <div className="source-url-container">
                <label>Source Thumbnail Image:</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    value="Click button to copy thumbnail" 
                    readOnly 
                    className="source-url-input"
                  />
                  <button onClick={handleCopyThumbnail} className="copy-url-button" title="Copy Thumbnail Image">
                    {isThumbnailCopied ? 'Copied!' : <i className="fas fa-image"></i>}
                  </button>
                </div>
                <button
                  className="redirect-thumbnail-button"
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    if (videoData?.thumbnail) {
                      window.open(videoData.thumbnail, '_blank');
                    }
                  }}
                  disabled={!videoData?.thumbnail}
                >
                  Redirect to Thumbnail
                </button>
              </div>
              <div className="post-sections">
                {parseGeneratedPost(generatedPost).map((section, index) => (
                  <div key={index} className="post-section">
                    <div className="section-header">
                      <label>Section {index}:</label>
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
                      rows={Math.min(Math.max(section.split('\n').length, 14), 27)}
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