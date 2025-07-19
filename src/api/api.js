import { API_ENDPOINTS } from '../config/constants';

// Create a helper function to get the base URL
const getBaseUrl = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? API_ENDPOINTS.DEV_LOCAL_URL : API_ENDPOINTS.PROD_BASE_URL;
};

// Replace the existing BASE_URL constant
const BASE_URL = getBaseUrl();

export const analyzeVideoWithProgress = async (
    { url, origin, videoID, selectedLanguage },
    { onProgress, onComplete, onError }
  ) => {
  
    const request_url = `${BASE_URL}/execute/stream`;
    console.log('Connecting to SSE endpoint:', request_url);
  
    try {
      const response = await fetch(request_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, origin, videoID, selectedLanguage }),
      });
  
      // --- Rate Limit Check ---
      if (response.status === 429) {
        const rateLimitData = await response.json();
        const error = new Error(rateLimitData.message || 'Rate limit reached');
        error.rateLimitData = rateLimitData; 
        localStorage.setItem('rateLimitInfo', JSON.stringify({
          isLimited: true,
          resetTime: rateLimitData.resetTime,
          message: rateLimitData.message || 'Rate limit exceeded.'
        }));
        onError(error);
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error starting analysis stream' }));
        throw new Error(errorData.detail || `Error starting stream: ${response.statusText}`);
      }
  
      // Clear rate limit info on successful connection
      localStorage.removeItem('rateLimitInfo');
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  
      //Stream the response from the server
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
  
        buffer += decoder.decode(value, { stream: true });
        // Events are separated by double newlines.
        const events = buffer.split('\n\n');
        // The last event might be incomplete, so we keep it in the buffer.
        buffer = events.pop(); 
  
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataString = event.substring(6);
            if (dataString) {
              try {
                const data = JSON.parse(dataString);
  
                if (data.status === 'progress') {
                  onProgress(data);
                } else if (data.status === 'complete') {
                  onComplete(data.data);
                  return; // Stream finished successfully
                } else if (data.status === 'error') {
                  onError(new Error(data.message));
                  return; // Stream finished with an error
                }
              } catch (e) {
                console.error("Failed to parse SSE event data:", dataString, e);
                onError(new Error("Failed to parse a server event."));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in analyzeVideoWithProgress:", error);
      onError(error);
    }
  };

export const generatePost = async ({ prompt }) => {
  const BASE_URL = getBaseUrl();
  const request_url = `${BASE_URL}/post/generate`; 

  // The payload will contain the final prompt constructed on the frontend
  const payload = {
    prompt: prompt
  };

  try {
    const response = await fetch(request_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      const rateLimitData = await response.json();
      const error = new Error(rateLimitData.message || 'Rate limit reached for post generation');
      error.rateLimitData = rateLimitData;
      console.error("Rate limit hit on generatePost:", rateLimitData);
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error calling /post/generate' }));
      throw new Error(errorData.detail || `Error from server: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Based on the Python endpoint, the response is expected to be in the format: {"response": "..."}
    return data.response;

  } catch (error) {
    console.error("Error in generatePost:", error);
    throw error;
  }
};

