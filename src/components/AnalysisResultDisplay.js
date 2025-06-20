import React from 'react';

const AnalysisResultDisplay = ({ analysisData, onClaimSelect, selectedClaims }) => {
  if (!analysisData || !analysisData.claims) {
    return null;
  }

  const claimsCount = analysisData.claims.length;
  const claimsLabel = claimsCount === 1 ? 'claim' : 'claims';

  return (
    <div className="analysis-result-display">
      <h3>Analysis Results ({claimsCount} {claimsLabel} found)</h3>
      <div className="claims-container">
        {analysisData.claims.map((claim, index) => (
          <div key={claim.id} className="claim-card">
            <div className="claim-header">
              <h4>{index + 1}. {claim.title}</h4>
              <input 
                type="checkbox" 
                className="claim-checkbox"
                checked={selectedClaims.includes(claim.id)}
                onChange={(e) => onClaimSelect(claim.id, e.target.checked)}
              />
            </div>
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
    </div>
  );
};

export default AnalysisResultDisplay; 