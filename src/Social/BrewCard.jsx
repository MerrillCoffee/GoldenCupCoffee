import React, { useState } from 'react';

export default function BrewCard({ brew, currentUser, isAdmin, loadProfile, handleLike, handleSave, handlePin, handleDeletePost, getLiquidOutput, isProfileView }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [localCommentCount, setLocalCommentCount] = useState(parseInt(brew.comment_count));

  const displayAsPinned = brew.is_pinned && isProfileView;

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brew.id}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
      setComments(await response.json());
    } catch (err) { console.error("Error fetching comments:", err); }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brew.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment_text: commentText })
      });
      if (response.ok) {
        setCommentText("");
        const updatedResponse = await fetch(`/api/social/brews/${brew.id}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
        setComments(await updatedResponse.json());
        setLocalCommentCount(prev => prev + 1);
      }
    } catch (err) { console.error("Comment post error:", err); }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/comments/${commentId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to toggle comment like.');
      const data = await response.json();
      setComments(prevComments => prevComments.map(c => c.id === commentId ? { ...c, has_liked: data.hasLiked, like_count: data.like_count } : c));
    } catch (err) { console.error("Comment like error:", err.message); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/comments/${commentId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to delete comment.');
      setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      setLocalCommentCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error("Comment delete error:", err.message); }
  };

  return (
    <div className="brew-card" style={displayAsPinned ? { border: '1px solid #d2a8ff' } : {}}>
      <div className="brew-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {displayAsPinned && <div style={{ color: '#d2a8ff', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>📌 Pinned Brew</div>}
          <span className="author" onClick={() => loadProfile(brew.author)} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }} title={`View @${brew.author}'s profile`}>
            @{brew.author}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentUser && currentUser.toLowerCase() === brew.author.toLowerCase() && (
            <button onClick={() => handlePin(brew.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: brew.is_pinned ? '#d2a8ff' : '#8b949e', fontSize: '0.85rem', fontWeight: 'bold' }}>
              📌 {brew.is_pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          <span className="timestamp">{new Date(brew.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="brew-card-body">
        {brew.blurb && <p className="blurb">{brew.blurb}</p>}
        <div className="brew-stats">
          {brew.roastery && <span className="stat-badge">🏭 {brew.roastery}</span>}
          <span className="stat-badge">{brew.roast_type} Roast</span>
          <span className="stat-badge">{brew.brew_method}</span>
          <span className="stat-badge">{getLiquidOutput(brew.coffee_amount, brew.brew_method)} - {brew.region}</span>
          {brew.grind_size && <span className="stat-badge">⚙️ {brew.grind_size} Grind</span>}
          {brew.water_temp && <span className="stat-badge">🌡️ {brew.water_temp.replace(/Â/g, ' ')}</span>}
        </div>
      </div>
      
      <div className="brew-card-actions">
        <button className={`action-btn ${brew.has_liked ? 'active-like' : ''}`} onClick={() => handleLike(brew.id)}>🤍 {brew.like_count}</button>
        <button className="action-btn" onClick={toggleComments}>💬 {localCommentCount}</button>
        <button className={`action-btn ${brew.has_saved ? 'active-save' : ''}`} onClick={() => handleSave(brew.id)}>🔖 {brew.has_saved ? 'Saved' : 'Save'}</button>
        {currentUser && (currentUser.toLowerCase() === brew.author.toLowerCase() || isAdmin) && (
          <button onClick={() => handleDeletePost(brew.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>🗑️ Delete</button>
        )}
      </div>

      {showComments && (
        <div className="comment-section">
          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="comment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <span className="author" onClick={() => loadProfile(c.username)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>@{c.username}</span> 
                    <span className="comment-text"> {c.comment_text}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className={`action-btn ${c.has_liked ? 'active-like' : ''}`} onClick={() => handleCommentLike(c.id)} style={{ fontSize: '0.85rem', padding: '0 8px' }}>🤍 {c.like_count || 0}</button>
                    {currentUser && (currentUser.toLowerCase() === c.username.toLowerCase() || isAdmin) && (
                      <button onClick={() => handleDeleteComment(c.id)} style={{ fontSize: '0.85rem', padding: '0 8px', color: '#f85149', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments" style={{ color: '#8b949e', fontStyle: 'italic', fontSize: '0.9rem' }}>No comments yet. Be the first!</p>
            )}
          </div>
          <div className="comment-input-area" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: '#c9d1d9' }} />
            <button onClick={handlePostComment} style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#238636', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}