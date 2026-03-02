import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PremiumError() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const reason = state?.reason || "Noma’lum xato";
  const order = state?.order;

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.iconBox}>⚠️</div>
        

        <h1 style={styles.title}>Xatolik yuz berdi</h1>

        <p style={styles.big}>
          Afsuski Premiumni faollashtirish imkoni bo‘lmadi.
        </p>

        <p style={styles.small}>Sabab:</p>

        <p style={styles.reason}>{reason}</p>

        {order?.id && (
          <p style={styles.orderId}>
            <b>Order ID:</b> {order.id}
             <h3>To'landi: {order.amount} so'm✅</h3>
        <h3>Premium muddati: {order.muddat_oy} oy</h3>
          </p>
        )}

        {/* Buttons */}
        <button style={styles.btnPrimary} onClick={() => navigate("/")}>
          ⬅️ Bosh sahifaga qaytish
        </button>

        <button
          style={styles.btnAdmin}
          onClick={() => window.open("https://t.me/starsjoy_bot", "_blank")}
        >
          👨🏻‍💻 Admin bilan bog‘lanish
        </button>

      </div>
    </div>
  );
}


/* ===============================
   INLINE CSS STYLES — MINI APP UI
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
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
    animation: "fadeIn 0.3s ease",
  },

  iconBox: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "10px",
  },

  big: {
    fontSize: "15px",
    color: "#444",
    marginBottom: "14px",
  },

  small: {
    fontSize: "13px",
    color: "#777",
    marginBottom: "4px",
  },

  reason: {
    fontSize: "14px",
    background: "#fff3f3",
    padding: "10px",
    borderRadius: "10px",
    color: "#c0392b",
    marginBottom: "10px",
    border: "1px solid #ffd6d6",
  },

  orderId: {
    fontSize: "14px",
    marginBottom: "18px",
  },

  btnPrimary: {
    width: "100%",
    padding: "12px",
    background: "#0088cc",
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    border: "none",
    borderRadius: "12px",
    marginTop: "10px",
    cursor: "pointer",
  },

  btnAdmin: {
    width: "100%",
    padding: "12px",
    background: "#f5f5f5",
    color: "#333",
    fontWeight: "600",
    fontSize: "15px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    marginTop: "10px",
    cursor: "pointer",
  },
};
