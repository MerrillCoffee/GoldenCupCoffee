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

  // Post Creation State
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({
    roastery: "", region: "", coffee_amount: "16 oz", roast_type: "Medium", brew_method: "Pour Over", blurb: ""
  });

  // Extract logged in user's JWT token
  let currentUser = null;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      currentUser = JSON.parse(atob(token.split('.')[1])).username;
    }
  } catch (e) {
    console.error("Could not parse token");
  }

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

  useEffect(() => {
    fetchFeed();
  }, []);

  // --- Handle New Social Post ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!postForm.blurb || !postForm.region) {
      alert("Please include at least your thoughts and a coffee region!");
      return;
    }

    try {
      const response = await fetch('/api/brews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...postForm,
          is_public: true
        })
      });

      if (response.ok) {
        setPostForm({ roastery: "", region: "", coffee_amount: "16 oz", roast_type: "Medium", brew_method: "Pour Over", blurb: "" });
        setShowPostForm(false);
        fetchFeed();
      } else {
        alert("Failed to post to the community.");
      }
    } catch (err) {
      console.error("Failed to post:", err);
    }
  };

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
      
      {/* Header and Toggle Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
        <h2 className="timeline-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Community Brews</h2>
        <button 
          onClick={() => setShowPostForm(!showPostForm)}
          style={{ background: showPostForm ? '#21262d' : '#238636', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showPostForm ? 'Cancel' : '📝 Share a Brew'}
        </button>
      </div>

      {/* Post Creation Form */}
      {showPostForm && (
        <div className="brew-card" style={{ border: '1px solid #2ea043', marginBottom: '2rem' }}>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              placeholder="What's brewing? Share your thoughts..."
              value={postForm.blurb}
              onChange={(e) => setPostForm({...postForm, blurb: e.target.value})}
              required
              style={{
              boxSizing: 'border-box',
              background: '#0d1117',
              border: '1px solid #30363d',
              padding: '10px', color: '#c9d1d9',
              borderRadius: '6px',
              minHeight: '60px',
              width: '100%',
              resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text" placeholder="Roastery (e.g. Onyx)" value={postForm.roastery}
                onChange={(e) => setPostForm({...postForm, roastery: e.target.value})}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px', minWidth: '120px' }}
              />
              <input
                type="text" placeholder="Region (e.g. Ethiopia)" value={postForm.region} required
                onChange={(e) => setPostForm({...postForm, region: e.target.value})}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px', minWidth: '120px' }}
              />
              <input
                type="text" placeholder="Amount (e.g. 16 oz)" value={postForm.coffee_amount} required
                onChange={(e) => setPostForm({...postForm, coffee_amount: e.target.value})}
                style={{ width: '100px', background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={postForm.roast_type}
                onChange={(e) => setPostForm({...postForm, roast_type: e.target.value})}
                style={{ background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}
              >
                <option value="Light">Light Roast</option>
                <option value="Medium">Medium Roast</option>
                <option value="Dark">Dark Roast</option>
              </select>

              <select
                value={postForm.brew_method}
                onChange={(e) => setPostForm({...postForm, brew_method: e.target.value})}
                style={{ background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}
              >
                <option value="Drip Brew">Drip Brew</option>
                <option value="Pour Over">Pour Over</option>
                <option value="Espresso">Espresso</option>
                <option value="French Press">French Press</option>
                <option value="Aeropress">Aeropress</option>
                <option value="Percolator">Percolator</option>
                <option value="Cold Brew">Cold Brew</option>
              </select>

              <button type="submit" style={{ marginLeft: 'auto', background: '#2ea043', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Post to Feed
              </button>
            </div>
          </form>
        </div>
      )}

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

            {/* Expanding comment section */}
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