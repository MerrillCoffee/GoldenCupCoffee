import React, { useState, useEffect } from 'react';
import './Social.css';

const METHOD_RATIOS = {
  "Drip Brew": 16.67, "Pour Over": 16.67, "French Press": 16.67,
  "Espresso": 2, "Aeropress": 11, "Percolator": 15, "Cold Brew": 8
};

const Social = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [feedFilter, setFeedFilter] = useState('global'); 
  const [viewingProfile, setViewingProfile] = useState(null);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);

  const [postForm, setPostForm] = useState({
    roastery: "", region: "", coffee_amount: "16 oz", roast_type: "Medium", brew_method: "Pour Over", water_temp: "", grind_size: "Medium", blurb: ""
  });

  let currentUser = null;
  let isAdmin = false; 
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      currentUser = decoded.username;
      isAdmin = decoded.is_admin === true; 
    }
  } catch (e) {
    console.error("Could not parse token");
  }

  const fetchFeed = async (pageNumber = 1, profileUser = viewingProfile, currentFilter = feedFilter) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = profileUser 
        ? `/api/social/users/${profileUser}/brews?page=${pageNumber}`
        : `/api/social/feed?page=${pageNumber}&filter=${currentFilter}`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch the timeline.');

      const data = await response.json();
      
      if (data.length < 10) setHasMore(false);
      else setHasMore(true);

      if (pageNumber === 1) setFeed(data);
      else setFeed(prevFeed => [...prevFeed, ...data]);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!viewingProfile) {
      setPage(1);
      fetchFeed(1, null, feedFilter);
    }
  }, [feedFilter]);

  const loadProfile = async (username) => {
    setViewingProfile(username);
    setPage(1);
    fetchFeed(1, username, feedFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentUser && currentUser.toLowerCase() !== username.toLowerCase()) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/social/users/${username}/is_following`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setIsFollowingProfile(data.isFollowing);
      } catch (e) { console.error("Error checking follow status"); }
    }
  };

  const closeProfile = () => {
    setViewingProfile(null);
    setPage(1);
    fetchFeed(1, null, feedFilter);
  };

  const handleToggleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/social/users/${viewingProfile}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setIsFollowingProfile(data.isFollowing);
    } catch (e) { console.error("Error toggling follow"); }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, viewingProfile, feedFilter);
  };

  const getLiquidOutput = (coffeeAmountStr, brewMethod) => {
    const str = String(coffeeAmountStr).toLowerCase();
    if (str.includes('oz') || str.includes('shot')) return str;
    const grams = parseFloat(str);
    if (isNaN(grams)) return coffeeAmountStr; 
    const ratio = METHOD_RATIOS[brewMethod] || 16.67;
    const waterMl = grams * ratio;
    const fluidOunces = Math.round(waterMl / 29.57);
    return `${fluidOunces} oz`;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!postForm.blurb || !postForm.region) return alert("Please include at least your thoughts and a coffee region!");

    try {
      const response = await fetch('/api/brews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...postForm, is_public: true })
      });

      if (response.ok) {
        setPostForm({ roastery: "", region: "", coffee_amount: "16 oz", roast_type: "Medium", brew_method: "Pour Over", water_temp: "", grind_size: "Medium", blurb: "" });
        setShowPostForm(false);
        setPage(1);
        fetchFeed(1, viewingProfile, feedFilter); 
      } else {
        alert("Failed to post to the community.");
      }
    } catch (err) { console.error("Failed to post:", err); }
  };

  const handleLike = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to toggle like.');
      const data = await response.json();
      setFeed(prevFeed => prevFeed.map(brew => brew.id === brewId ? { ...brew, has_liked: data.hasLiked, like_count: data.like_count } : brew));
    } catch (err) { console.error("Like error:", err.message); }
  };

  const handleSave = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/save`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to toggle save.');
      const data = await response.json();
      setFeed(prevFeed => prevFeed.map(brew => brew.id === brewId ? { ...brew, has_saved: data.hasSaved } : brew));
    } catch (err) { console.error("Save error:", err.message); }
  };

  // --- Handle Pinning ---
  const handlePin = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/pin`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || "Failed to pin post.");
        return;
      }

      setFeed(prevFeed => {
        const updatedFeed = prevFeed.map(brew => brew.id === brewId ? { ...brew, is_pinned: data.isPinned } : brew);
        
        if (viewingProfile) {
           return updatedFeed.sort((a, b) => {
              if (a.is_pinned && !b.is_pinned) return -1;
              if (!a.is_pinned && b.is_pinned) return 1;
              return new Date(b.created_at) - new Date(a.created_at);
           });
        }
        return updatedFeed;
      });
    } catch (err) { 
      console.error("Pin error:", err.message); 
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
        const response = await fetch(`/api/social/brews/${brewId}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
        setComments(await response.json());
      } catch (err) { console.error("Error fetching comments:", err); }
    }
  };

  const handlePostComment = async (brewId) => {
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment_text: commentText })
      });
      if (response.ok) {
        setCommentText("");
        const updatedResponse = await fetch(`/api/social/brews/${brewId}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
        setComments(await updatedResponse.json());
        setFeed(prevFeed => prevFeed.map(brew => brew.id === brewId ? { ...brew, comment_count: parseInt(brew.comment_count) + 1 } : brew));
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

  const handleDeletePost = async (brewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this brew from the community?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brews/${brewId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to delete post.');
      setFeed(prevFeed => prevFeed.filter(brew => brew.id !== brewId));
    } catch (err) { console.error("Post delete error:", err.message); }
  };

  const handleDeleteComment = async (commentId, brewId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/comments/${commentId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to delete comment.');
      setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      setFeed(prevFeed => prevFeed.map(brew => brew.id === brewId ? { ...brew, comment_count: Math.max(0, parseInt(brew.comment_count) - 1) } : brew));
    } catch (err) { console.error("Comment delete error:", err.message); }
  };
  
  if (loading && page === 1) return <div className="timeline-message">Loading the brew feed...</div>;
  if (error) return <div className="timeline-message error">Error: {error}</div>;

  return (
    <div className="social-container">
      
      {viewingProfile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>
          <button onClick={closeProfile} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⬅️ Back to Feed
          </button>
          <h2 className="timeline-header" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>@{viewingProfile}'s Brews</h2>
          
          {currentUser && currentUser.toLowerCase() !== viewingProfile.toLowerCase() && (
            <button 
              onClick={handleToggleFollow}
              style={{ 
                marginLeft: 'auto',
                background: isFollowingProfile ? '#21262d' : '#c9d1d9', 
                color: isFollowingProfile ? '#c9d1d9' : '#0d1117', 
                border: isFollowingProfile ? '1px solid #30363d' : 'none', 
                padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              {isFollowingProfile ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="timeline-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Community Brews</h2>
          <button onClick={() => setShowPostForm(!showPostForm)} style={{ background: showPostForm ? '#21262d' : '#238636', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {showPostForm ? 'Cancel' : '📝 Share a Brew'}
          </button>
        </div>
      )}

      {!viewingProfile && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>
          <button 
            onClick={() => setFeedFilter('global')}
            style={{ 
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold',
              background: feedFilter === 'global' ? '#21262d' : 'transparent', 
              color: feedFilter === 'global' ? '#c9d1d9' : '#8b949e', 
              border: feedFilter === 'global' ? '1px solid #30363d' : '1px solid transparent'
            }}
          >
            🌍 Global Feed
          </button>
          <button 
            onClick={() => setFeedFilter('following')}
            style={{ 
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold',
              background: feedFilter === 'following' ? '#21262d' : 'transparent', 
              color: feedFilter === 'following' ? '#c9d1d9' : '#8b949e', 
              border: feedFilter === 'following' ? '1px solid #30363d' : '1px solid transparent'
            }}
          >
            👥 Following
          </button>
        </div>
      )}

      {showPostForm && !viewingProfile && (
        <div className="brew-card" style={{ border: '1px solid #2ea043', marginBottom: '2rem' }}>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea placeholder="What's brewing? Share your thoughts..." value={postForm.blurb} onChange={(e) => setPostForm({...postForm, blurb: e.target.value})} required style={{ boxSizing: 'border-box', background: '#0d1117', border: '1px solid #30363d', padding: '10px', color: '#c9d1d9', borderRadius: '6px', minHeight: '60px', width: '100%', resize: 'vertical' }} />
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Roastery (e.g. Onyx)" value={postForm.roastery} onChange={(e) => setPostForm({...postForm, roastery: e.target.value})} style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px', minWidth: '120px' }} />
              <input type="text" placeholder="Region (e.g. Ethiopia)" value={postForm.region} required onChange={(e) => setPostForm({...postForm, region: e.target.value})} style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px', minWidth: '120px' }} />
              <input type="text" placeholder="Amount (e.g. 16 oz)" value={postForm.coffee_amount} required onChange={(e) => setPostForm({...postForm, coffee_amount: e.target.value})} style={{ width: '100px', background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={postForm.roast_type} onChange={(e) => setPostForm({...postForm, roast_type: e.target.value})} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}>
                <option value="Light">Light Roast</option>
                <option value="Medium">Medium Roast</option>
                <option value="Dark">Dark Roast</option>
              </select>

              <select value={postForm.brew_method} onChange={(e) => setPostForm({...postForm, brew_method: e.target.value})} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}>
                <option value="Drip Brew">Drip Brew</option>
                <option value="Pour Over">Pour Over</option>
                <option value="Espresso">Espresso</option>
                <option value="French Press">French Press</option>
                <option value="Aeropress">Aeropress</option>
                <option value="Percolator">Percolator</option>
                <option value="Cold Brew">Cold Brew</option>
              </select>

              <select value={postForm.grind_size} onChange={(e) => setPostForm({...postForm, grind_size: e.target.value})} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }}>
                <option value="Extra Fine">Extra Fine</option>
                <option value="Fine">Fine</option>
                <option value="Medium-Fine">Medium-Fine</option>
                <option value="Medium">Medium</option>
                <option value="Medium-Coarse">Medium-Coarse</option>
                <option value="Coarse">Coarse</option>
                <option value="Extra Coarse">Extra Coarse</option>
              </select>

              <input type="text" placeholder="Temp (e.g. 200°F)" value={postForm.water_temp} onChange={(e) => setPostForm({...postForm, water_temp: e.target.value})} style={{ width: '100px', background: '#0d1117', border: '1px solid #30363d', padding: '8px', color: '#c9d1d9', borderRadius: '4px' }} />

              <button type="submit" style={{ marginLeft: 'auto', background: '#2ea043', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Post to Feed</button>
            </div>
          </form>
        </div>
      )}

      {feed.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#8b949e', marginTop: '30px' }}>
          {feedFilter === 'following' && !viewingProfile 
            ? "You aren't following anyone with public posts yet. Explore the Global Feed!" 
            : "No brews found."}
        </p>
      )}

      <div className="timeline-feed">
        {feed.map((brew) => (
          <div key={brew.id} className="brew-card" style={brew.is_pinned ? { border: '1px solid #d2a8ff' } : {}}>
            
            <div className="brew-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {brew.is_pinned && <div style={{ color: '#d2a8ff', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>📌 Pinned Brew</div>}
                
                <span className="author" onClick={() => loadProfile(brew.author)} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }} title={`View @${brew.author}'s profile`}>
                  @{brew.author}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {currentUser && currentUser.toLowerCase() === brew.author.toLowerCase() && (
                  <button 
                    onClick={() => handlePin(brew.id)} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: brew.is_pinned ? '#d2a8ff' : '#8b949e', fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
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
              <button className="action-btn" onClick={() => toggleComments(brew.id)}>💬 {brew.comment_count}</button>
              <button className={`action-btn ${brew.has_saved ? 'active-save' : ''}`} onClick={() => handleSave(brew.id)}>🔖 {brew.has_saved ? 'Saved' : 'Save'}</button>
              
              {currentUser && (currentUser.toLowerCase() === brew.author.toLowerCase() || isAdmin) && (
                <button onClick={() => handleDeletePost(brew.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>🗑️ Delete</button>
              )}
            </div>

            {activeCommentId === brew.id && (
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
                            <button onClick={() => handleDeleteComment(c.id, brew.id)} style={{ fontSize: '0.85rem', padding: '0 8px', color: '#f85149', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
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
                  <button onClick={() => handlePostComment(brew.id)} style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#238636', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Post</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {hasMore && feed.length > 0 && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <button onClick={loadMore} style={{ padding: '10px 20px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Load More Brews 👇
            </button>
          </div>
        )}
        
        {!hasMore && feed.length > 0 && (
          <p style={{ textAlign: 'center', color: '#8b949e', marginTop: '30px', fontStyle: 'italic' }}>
            {viewingProfile ? `That's all of @${viewingProfile}'s public brews!` : "You've reached the end of the feed!"}
          </p>
        )}

      </div>
    </div>
  );
};

export default Social;