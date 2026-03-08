import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import lottie from 'lottie-web';
import pako from 'pako';

export const TGSSticker = forwardRef(({ stickerPath, className, autoplay = true, loop = true, onMouseEnter, onMouseLeave }, ref) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Expose play/pause methods to parent
  useImperativeHandle(ref, () => ({
    play: () => animationRef.current?.play(),
    pause: () => animationRef.current?.pause(),
    stop: () => animationRef.current?.stop(),
    goToAndStop: (frame) => animationRef.current?.goToAndStop(frame, true),
  }));

  // Load animation only when stickerPath changes
  useEffect(() => {
    isLoadedRef.current = false;
    
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
            loop: loop,
            autoplay: autoplay,
            animationData: animationData,
          });
          
          isLoadedRef.current = true;
          
          // Agar autoplay false bo'lsa, birinchi frameda to'xtat
          if (!autoplay && animationRef.current) {
            animationRef.current.goToAndStop(0, true);
          }
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

  // Handle autoplay changes without reloading
  useEffect(() => {
    if (!isLoadedRef.current || !animationRef.current) return;
    
    if (autoplay) {
      animationRef.current.play();
    } else {
      animationRef.current.pause();
    }
  }, [autoplay]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
});

// Named export uchun backward compatibility
export { TGSSticker as default };
