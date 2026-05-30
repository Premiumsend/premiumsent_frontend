import React from "react";
import { PaymeeStockBanner } from "./PaymeeStockBanner";
import "./PaymeeStockAlert.css";

/**
 * Gift va boshqa joylarda alert o'rniga — Lottie bilan modal
 */
export function PaymeeStockAlert({ product, message, onClose }) {
  if (!message) return null;

  return (
    <div className="paymee-stock-alert-overlay" onClick={onClose} role="presentation">
      <div
        className="paymee-stock-alert-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"

      >
        <PaymeeStockBanner product={product} message={message} className="paymee-stock-banner--modal" />
        <button type="button" className="paymee-stock-alert-btn" onClick={onClose}>
          Tushundim
        </button>
      </div>
    </div>
  );
}
