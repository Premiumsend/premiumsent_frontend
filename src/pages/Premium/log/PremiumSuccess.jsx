import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.iconBox}>🎉</div>

        <h1 style={styles.title}>Premium faollashtirildi!</h1>

        <p style={styles.big}>Tabriklaymiz! 👑</p>
        <p style={styles.small}>
          Sizning Telegram Premiumingiz muvaffaqiyatli faollashtirildi.
        </p>

        {order?.transaction_id && (
          <p style={styles.txBox}>
            <b>Transaction ID:</b>
            <code style={styles.txId}>{order.transaction_id}</code>
          </p>
        )}

        <button style={styles.btnPrimary} onClick={() => navigate("/")}>
          ⬅️ Bosh sahifaga qaytish
        </button>

      </div>
    </div>
  );
}


/* ===============================
   INLINE CSS — PREMIUM SUCCESS UI
   =============================== */

const styles = {
  page: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Inter, sans-serif",
    color: "#1a1a1a",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "26px",
    boxShadow: "0 6px 22px rgba(0,0,0,0.10)",
    textAlign: "center",
    animation: "fadeIn 0.3s ease",
  },

  iconBox: {
    fontSize: "50px",
    marginBottom: "14px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "8px",
  },

  big: {
    fontSize: "16px",
    color: "#444",
    marginBottom: "6px",
    fontWeight: 600,
  },

  small: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "20px",
  },

  txBox: {
    background: "#eef7ff",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "18px",
    fontSize: "14px",
    border: "1px solid #d5ebff",
  },

  txId: {
    marginLeft: "6px",
    fontSize: "13px",
    background: "#fff",
    padding: "4px 6px",
    borderRadius: "6px",
  },

  btnPrimary: {
    width: "100%",
    padding: "12px",
    background: "#0088cc",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
