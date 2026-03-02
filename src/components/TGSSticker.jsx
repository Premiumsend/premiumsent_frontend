import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import pako from 'pako';

export function TGSSticker({ stickerPath, className }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const fetchAndPlay = async () => {
      try {
        const response = await fetch(stickerPath);
        const arrayBuffer = await response.arrayBuffer();

        // Decompress the TGS file (it's a gzipped JSON)
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer));
        const jsonString = new TextDecoder().decode(decompressed);
        const animationData = JSON.parse(jsonString);

        if (containerRef.current) {
          // Stop previous animation if any
          if (animationRef.current) {
            animationRef.current.destroy();
          }

          animationRef.current = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData,
          });
        }
      } catch (error) {
        console.error(`Error loading sticker ${stickerPath}:`, error);
      }
    };

    fetchAndPlay();

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [stickerPath]);

  return <div ref={containerRef} className={className} />;
}
