import React from 'react';
import '../styles/VideoInfoDisplay.css';

const VideoInfoDisplay = ({ videoData, videoID }) => {
  if (!videoData) {
    return null;
  }

  const {
    title,
    channel_title,
    published_at,
    duration,
    view_count,
    tags,
  } = videoData;

  // Format view count
  // const formattedViewCount = Number(view_count).toLocaleString();

  // Format tags
  const formattedTags = tags && tags.length > 0 ? tags.join(', ') : 'No tags available';

  return (
    <div className="video-info-display">
      <h2 className="video-title">{title}</h2>
      <div className="video-meta">
        <span className="channel-title">By: {channel_title}</span>
        <span className="published-date">Published: {published_at}</span>
      </div>
      <div className="video-stats">
        <span className="duration">Duration: {duration}</span>
        <span className="view-count">Views: {view_count}</span>
      </div>
      <div className="video-tags">
        <strong>Tags:</strong> {formattedTags}
      </div>
      <div className="video-id">
        <strong>Video ID:</strong> {videoID}
      </div>
    </div>
  );
};

export default VideoInfoDisplay; 