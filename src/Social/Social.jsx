import React, { useState, useEffect } from 'react';
import PostForm from './PostForm';
import BrewCard from './BrewCard';
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
  const [showPostForm, setShowPostForm] = useState(false);

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
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const endpoint = profileUser 
        ? `/api/social/users/${profileUser}/brews?page=${pageNumber}`
        : `/api/social/feed?page=${pageNumber}&filter=${currentFilter}`;

      const response = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch the timeline.');

      const data = await response.json();
      if (data.length < 10) setHasMore(false);
      else setHasMore(true);

      if (pageNumber === 1) setFeed(data);
      else setFeed(prevFeed => [...prevFeed, ...data]);
      
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
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
        const res = await fetch(`/api/social/users/${username}/is_following`, { headers: { 'Authorization': `Bearer ${token}` } });
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
      const res = await fetch(`/api/social/users/${viewingProfile}/follow`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleLike = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setFeed(prev => prev.map(b => b.id === brewId ? { ...b, has_liked: data.hasLiked, like_count: data.like_count } : b));
    } catch (err) { console.error("Like error:", err.message); }
  };

  const handleSave = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/save`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setFeed(prev => prev.map(b => b.id === brewId ? { ...b, has_saved: data.hasSaved } : b));
    } catch (err) { console.error("Save error:", err.message); }
  };

  const handlePin = async (brewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/brews/${brewId}/pin`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) return alert(data.error || "Failed to pin post.");

      setFeed(prev => {
        const updatedFeed = prev.map(b => b.id === brewId ? { ...b, is_pinned: data.isPinned } : b);
        if (viewingProfile) {
           return updatedFeed.sort((a, b) => {
              if (a.is_pinned && !b.is_pinned) return -1;
              if (!a.is_pinned && b.is_pinned) return 1;
              return new Date(b.created_at) - new Date(a.created_at);
           });
        }
        return updatedFeed;
      });
    } catch (err) { console.error("Pin error:", err.message); }
  };

  const handleDeletePost = async (brewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this brew from the community?")) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/brews/${brewId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setFeed(prev => prev.filter(b => b.id !== brewId));
    } catch (err) { console.error("Post delete error:", err.message); }
  };
  
  // ==========================================
  // EARLY RETURNS FOR RENDER LOGIC
  // ==========================================

  if (!currentUser) {
    return (
      <div className="social-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🌍</div>
        <h2 style={{ color: '#c9d1d9', marginBottom: '15px' }}>Join the Community</h2>
        <p style={{ color: '#8b949e', fontSize: '1.1em', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Please log in or create an account via the <strong>Account</strong> tab to view the community timeline, share your favorite brews, and interact with other coffee lovers!
        </p>
      </div>
    );
  }

  if (loading && page === 1) return <div className="timeline-message">Loading the brew feed...</div>;
  if (error) return <div className="timeline-message error">Error: {error}</div>;

  return (
    <div className="social-container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {viewingProfile ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '2rem', 
          borderBottom: '1px solid #30363d', 
          paddingBottom: '15px',
          flexWrap: 'wrap'    
        }}>
          <button onClick={closeProfile} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>⬅️ Back</button>
          
          <h2 className="timeline-header" style={{ borderBottom: 'none', margin: 0, padding: 0, flex: '1', minWidth: 0, fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{viewingProfile}'s Brews
          </h2>
          
          {currentUser && currentUser.toLowerCase() !== viewingProfile.toLowerCase() && (
            <button onClick={handleToggleFollow} style={{ marginLeft: 'auto', background: isFollowingProfile ? '#21262d' : '#c9d1d9', color: isFollowingProfile ? '#c9d1d9' : '#0d1117', border: isFollowingProfile ? '1px solid #30363d' : 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>
              {isFollowingProfile ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="timeline-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Community Brews</h2>
          <button onClick={() => setShowPostForm(!showPostForm)} style={{ background: showPostForm ? '#21262d' : '#238636', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {showPostForm ? 'Cancel' : '📝 Share a Brew'}
          </button>
        </div>
      )}

      {!viewingProfile && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid #30363d', paddingBottom: '15px', flexWrap: 'wrap' }}>
          <button onClick={() => setFeedFilter('global')} style={{ padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: feedFilter === 'global' ? '#21262d' : 'transparent', color: feedFilter === 'global' ? '#c9d1d9' : '#8b949e', border: feedFilter === 'global' ? '1px solid #30363d' : '1px solid transparent' }}>🌍 Global Feed</button>
          <button onClick={() => setFeedFilter('following')} style={{ padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: feedFilter === 'following' ? '#21262d' : 'transparent', color: feedFilter === 'following' ? '#c9d1d9' : '#8b949e', border: feedFilter === 'following' ? '1px solid #30363d' : '1px solid transparent' }}>👥 Following</button>
        </div>
      )}

      {showPostForm && !viewingProfile && (
        <PostForm onSuccess={() => { setShowPostForm(false); setPage(1); fetchFeed(1, viewingProfile, feedFilter); }} />
      )}

      {feed.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#8b949e', marginTop: '30px' }}>
          {feedFilter === 'following' && !viewingProfile ? "You aren't following anyone with public posts yet. Explore the Global Feed!" : "No brews found."}
        </p>
      )}

      <div className="timeline-feed">
        {feed.map((brew) => (
          <BrewCard 
            key={brew.id} 
            brew={brew} 
            currentUser={currentUser} 
            isAdmin={false} 
            loadProfile={loadProfile} 
            handleLike={handleLike} 
            handleSave={handleSave} 
            handlePin={handlePin} 
            handleDeletePost={handleDeletePost} 
            getLiquidOutput={getLiquidOutput} 
            isProfileView={!!viewingProfile} 
          />
        ))}

        {hasMore && feed.length > 0 && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <button onClick={loadMore} style={{ padding: '10px 20px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Load More Brews 👇</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;