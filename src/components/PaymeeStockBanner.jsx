import React from "react";
import { TGSSticker } from "./TGSSticker";
import { PAYMEE_STOCK_TEXT } from "../utils/paymeeErrors";
import starsSticker from "../assets/AnimatedSticker_stars.tgs";
import premiumSticker from "../assets/AnimatedSticker_premium.tgs";
import giftSticker from "../assets/AnimatedSticker.tgs";
import "./PaymeeStockBanner.css";

const STOCK_LOTTIE = {
  stars: starsSticker,
  premium: premiumSticker,
  gift: giftSticker,
};

/**
 * Paymee balans tugaganda — Lottie (TGS) ikonka + matn
 * @param {'stars'|'premium'|'gift'} product
 * @param {string} [message] — API yoki maxsus matn
 */
export function PaymeeStockBanner({ product = "stars", message, className = "" }) {
  const stickerPath = STOCK_LOTTIE[product] || STOCK_LOTTIE.stars;
  const text = message || PAYMEE_STOCK_TEXT[product] || PAYMEE_STOCK_TEXT.stars;

  return (
    <div className={`paymee-stock-banner ${className}`.trim()} role="alert">
      <div className="paymee-stock-banner__icon" aria-hidden>
        <TGSSticker
          stickerPath={stickerPath}
          className="paymee-stock-banner__lottie"
          autoplay
          loop
        />
      </div>
      <p className="paymee-stock-banner__text">{text}</p>
    </div>
  );
}
