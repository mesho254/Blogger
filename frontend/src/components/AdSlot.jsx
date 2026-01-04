import React, { useEffect, useRef } from 'react';
import { styles } from '../styles/theme';

// position can be a named position like 'inline'|'sidebar'|'top' or a numeric ad-slot id string
function AdSlot({ position }) {
  const adRef = useRef(null);
  const scriptRef = useRef(null); // To track the script element

  // Resolve ad client and slot from env vars; fall back to placeholders
  const AD_CLIENT = import.meta.env.VITE_AD_CLIENT || 'ca-pub-XXXX';
  const slotMap = {
    inline: import.meta.env.VITE_AD_SLOT_INLINE,
    sidebar: import.meta.env.VITE_AD_SLOT_SIDEBAR,
    top: import.meta.env.VITE_AD_SLOT_TOP,
  };

  const slot = slotMap[position] || position || import.meta.env.VITE_AD_SLOT_DEFAULT || 'XXXX';

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'development') return;

    // If AD_CLIENT is not configured, don't try to load AdSense script; show placeholder instead
    if (!AD_CLIENT || AD_CLIENT === 'ca-pub-XXXX') {
      return;
    }

    // Ensure the AdSense script is present only once
    let script = document.querySelector('script[data-ad-client]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.setAttribute('data-ad-client', AD_CLIENT);
      scriptRef.current = script; // Track for event listener
      document.head.appendChild(script);
      console.log('AdSense script appended to head'); // Log script addition
    }

    const render = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`AdSense connected and pushed successfully for slot: ${slot}`); // Log success
      } catch (err) {
        console.error('Ad push error:', err); // Log for debugging
      }
    };

    // Wait for script to load before rendering
    const onScriptLoad = () => {
      console.log('AdSense script loaded successfully'); // Log connection/load success
      render();
    };

    if (script.complete || script.readyState === 'complete') {
      onScriptLoad();
    } else {
      script.addEventListener('load', onScriptLoad);
    }

    // Cleanup: Remove listener if component unmounts
    return () => {
      if (script) {
        script.removeEventListener('load', onScriptLoad);
      }
    };
  }, []); // Empty deps: Run only on mount

  return (
    <div style={{ margin: styles.margin, textAlign: 'center' }}>
      {!AD_CLIENT || AD_CLIENT === 'ca-pub-XXXX' ? (
        <div style={{ border: '1px dashed #ccc', padding: '1rem', borderRadius: styles.borderRadius, background: '#fafafa' }}>
          <strong>Ad placeholder</strong>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>Set VITE_AD_CLIENT and slot env vars to display real ads.</div>
        </div>
      ) : (
        <ins
          key={position} // Unique key to force remount if position changes
          className="adsbygoogle"
          ref={adRef}
          style={{ display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}

export default AdSlot;