import React, { useState } from 'react';

export default function PostForm({ onSuccess }) {
  const [postForm, setPostForm] = useState({
    roastery: "", region: "", coffee_amount: "16 oz", roast_type: "Medium", 
    brew_method: "Pour Over", water_temp: "", grind_size: "Medium", blurb: ""
  });

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
        onSuccess();
      } else {
        alert("Failed to post to the community.");
      }
    } catch (err) { 
      console.error("Failed to post:", err); 
    }
  };

  return (
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
  );
}