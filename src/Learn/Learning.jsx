import React from 'react';

// The data array containing Hoffmann's guides mapped to your exact app methods
const BREW_GUIDES = [
  {
    method: "Pour Over",
    description: "The Ultimate V60 Technique. Learn how to extract the brightest, most balanced flavors using precise water temperature, a blooming phase, and a structured pour.",
    videoId: "1oB1oDrDkHM"
  },
  {
    method: "French Press",
    description: "The Ultimate French Press Technique. Say goodbye to sludgy, silty coffee. This revolutionary no-press, long-steep method creates an incredibly clean cup.",
    videoId: "st571DYYTR8"
  },
  {
    method: "Aeropress",
    description: "The Ultimate Aeropress Technique. A simple, repeatable recipe that avoids the inverted method while still delivering a sweet, full-bodied extraction.",
    videoId: "j6VlT_jUVPc"
  },
  {
    method: "Espresso",
    description: "Understanding Espresso with Morgan Eckroth. A deep dive into dialing in your grinder, managing your yield ratio, and understanding the science behind the perfect puck.",
    videoId: "c-27BTOAqig" 
  },
  {
    method: "Drip Brew",
    description: "How to Make Better Coffee in a Machine. You don't need a manual brewer to get great coffee! Learn how to optimize your standard drip machine with James Hoffmann.",
    videoId: "P-Ga8SRhRrE" 
  },
  {
    method: "Percolator (Moka Pot)",
    description: "The Ultimate Moka Pot Technique. Often misunderstood, the stovetop percolator can create incredibly rich, syrup-like coffee if you control the heat correctly.",
    videoId: "BfDLoIvb0w4" 
  },
  {
    method: "Cold Brew",
    description: "How to Make Better Cold Brew with Morgan Eckroth. A straightforward guide to steep times, dilution ratios, and filtering to get that perfectly smooth summer concentrate.",
    videoId: "c1UbW3cKGe0" 
  }
];

export default function Learning() {
  return (
    <div className="learning-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>
        <h2 style={{ color: '#c9d1d9', margin: '0 0 10px 0' }}>The Golden Cup Curriculum</h2>
        <p style={{ color: '#8b949e', margin: 0, fontSize: '1.05em', lineHeight: '1.5' }}>
          Master your technique with the official guides curated from world-class coffee experts like James Hoffmann and Morgan Eckroth. 
          Watch the tutorials, apply the ratios in your Brew tab, and share your results with the community.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {BREW_GUIDES.map((guide) => (
          <div 
            key={guide.method} 
            className="guide-card"
            style={{ 
              background: '#161b22', 
              border: '1px solid #30363d', 
              borderRadius: '8px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            
            {/* Responsive 16:9 Video Container */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#0d1117' }}>
              <iframe 
                src={`https://www.youtube.com/embed/${guide.videoId}?rel=0`} 
                title={`${guide.method} Tutorial`}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              ></iframe>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#58a6ff', fontSize: '1.3em' }}>
                {guide.method}
              </h3>
              <p style={{ color: '#c9d1d9', margin: 0, lineHeight: '1.5', fontSize: '0.95em' }}>
                {guide.description}
              </p>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}