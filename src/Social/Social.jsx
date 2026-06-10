import React, { useState, useEffect } from 'react';
import './Social.css';

const Social = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/social/feed', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch the timeline.');
        }

        const data = await response.json();
        setFeed(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) return <div className="timeline-message">Loading the brew feed...</div>;
  if (error) return <div className="timeline-message error">Error: {error}</div>;

  return (
    <div className="social-container">
      <h2 className="timeline-header">Community Brews</h2>
      
      <div className="timeline-feed">
        {feed.map((brew) => (
          <div key={brew.id} className="brew-card">
            <div className="brew-card-header">
              <span className="author">@{brew.author}</span>
              <span className="timestamp">{new Date(brew.created_at).toLocaleDateString()}</span>
            </div>
            <div className="brew-card-body">
              {brew.blurb && <p className="blurb">{brew.blurb}</p>}
              <div className="brew-stats">
                <span className="stat-badge">{brew.roast_type} Roast</span>
                <span className="stat-badge">{brew.brew_method}</span>
                <span className="stat-badge">{brew.coffee_amount} - {brew.region}</span>
              </div>
            </div>
            <div className="brew-card-actions">
              <button className={`action-btn ${brew.has_liked ? 'active-like' : ''}`}>
                🤍 {brew.like_count}
              </button>
              <button className="action-btn">
                💬 {brew.comment_count}
              </button>
              <button className={`action-btn ${brew.has_saved ? 'active-save' : ''}`}>
                🔖 {brew.has_saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Social;