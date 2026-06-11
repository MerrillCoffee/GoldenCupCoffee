import React, { useState, useEffect } from 'react';
import './Social.css';

const Social = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comment System State
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  // Extract logged in user's JTW token
  let currentUser = null;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      currentUser = JSON.parse(atob(token.split('.')[1])).username;
    }
  } catch (e) {
    console.error("Could not parse token");
  }

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/social/feed', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch the timeline.');

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

  const handleLike = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle like.');
      const data = await response.json();

      setFeed(prevFeed => prevFeed.map(brew => 
        brew.id === brewId ? { ...brew, has_liked: data.hasLiked, like_count: data.like_count } : brew
      ));
    } catch (err) {
      console.error("Like error:", err.message);
    }
  };

  const handleSave = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle save.');
      const data = await response.json();

      setFeed(prevFeed => prevFeed.map(brew => 
        brew.id === brewId ? { ...brew, has_saved: data.hasSaved } : brew
      ));
    } catch (err) {
      console.error("Save error:", err.message);
    }
  };

  const toggleComments = async (brewId) => {
    if (activeCommentId === brewId) {
      setActiveCommentId(null);
      setComments([]);
    } else {
      setActiveCommentId(brewId);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/social/brews/${brewId}/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    }
  };

  const handlePostComment = async (brewId) => {
    if (!commentText.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ comment_text: commentText })
      });

      if (response.ok) {
        setCommentText("");

        const updatedResponse = await fetch(`/api/social/brews/${brewId}/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedData = await updatedResponse.json();
        setComments(updatedData);

        setFeed(prevFeed => prevFeed.map(brew => 
          brew.id === brewId ? { ...brew, comment_count: parseInt(brew.comment_count) + 1 } : brew
        ));
      }
    } catch (err) {
      console.error("Comment post error:", err);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle comment like.');
      const data = await response.json();

      setComments(prevComments => prevComments.map(c => 
        c.id === commentId ? { ...c, has_liked: data.hasLiked, like_count: data.like_count } : c
      ));
    } catch (err) {
      console.error("Comment like error:", err.message);
    }
  };

  const handleDeleteComment = async (commentId, brewId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete comment.');

      setComments(prevComments => prevComments.filter(c => c.id !== commentId));

      setFeed(prevFeed => prevFeed.map(brew => 
        brew.id === brewId ? { ...brew, comment_count: Math.max(0, parseInt(brew.comment_count) - 1) } : brew
      ));
    } catch (err) {
      console.error("Comment delete error:", err.message);
    }
  };
  
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
                {brew.roastery && <span className="stat-badge">🏭 {brew.roastery}</span>}
                <span className="stat-badge">{brew.roast_type} Roast</span>
                <span className="stat-badge">{brew.brew_method}</span>
                <span className="stat-badge">{brew.coffee_amount} - {brew.region}</span>
              </div>
            </div>
            
            <div className="brew-card-actions">
              <button 
                className={`action-btn ${brew.has_liked ? 'active-like' : ''}`}
                onClick={() => handleLike(brew.id)}
              >
                🤍 {brew.like_count}
              </button>
              
              <button className="action-btn" onClick={() => toggleComments(brew.id)}>
                💬 {brew.comment_count}
              </button>
              <button 
                className={`action-btn ${brew.has_saved ? 'active-save' : ''}`}
                onClick={() => handleSave(brew.id)}
              >
                🔖 {brew.has_saved ? 'Saved' : 'Save'}
              </button>
            </div>

            {activeCommentId === brew.id && (
              <div className="comment-section">
                
                <div className="comments-list">
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="comment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <span className="author">@{c.username}</span> 
                          <span className="comment-text"> {c.comment_text}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className={`action-btn ${c.has_liked ? 'active-like' : ''}`}
                            onClick={() => handleCommentLike(c.id)}
                            style={{ fontSize: '0.85rem', padding: '0 8px' }}
                          >
                            🤍 {c.like_count || 0}
                          </button>

                          {currentUser === c.username && (
                            <button 
                              onClick={() => handleDeleteComment(c.id, brew.id)}
                              style={{ 
                                fontSize: '0.85rem', padding: '0 8px', color: '#f85149', 
                                background: 'transparent', border: 'none', cursor: 'pointer' 
                              }}
                              title="Delete Comment"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-comments" style={{ color: '#8b949e', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      No comments yet. Be the first!
                    </p>
                  )}
                </div>

                <div className="comment-input-area" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: '#c9d1d9' }}
                  />
                  <button 
                    onClick={() => handlePostComment(brew.id)}
                    style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#238636', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Post
                  </button>
                </div>

              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default Social;