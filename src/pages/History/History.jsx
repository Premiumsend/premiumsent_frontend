import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import { TGSSticker } from "../../components/TGSSticker";
import "./History.css";
import WebApp from "@twa-dev/sdk";
import buyurtmalarSticker from "../../assets/AnimatedSticker_buyurtmalar.tgs";
import premiumGif from "../../assets/premium_gif.gif";
import apiFetch from "../../utils/apiFetch";

export default function History() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, success, failed, expired, pending

  // Format amount helper
  const formatAmount = (num) =>
    Number(num || 0).toLocaleString("ru-RU");

  // Telegram BackButton
  useEffect(() => {
    try {
      if (WebApp && WebApp.BackButton) {
        WebApp.BackButton.show();
        const handleBack = () => navigate("/");
        WebApp.BackButton.onClick(handleBack);
        
        return () => {
          WebApp.BackButton.offClick(handleBack);
          WebApp.BackButton.hide();
        };
      }
    } catch (err) {
      console.error("BackButton xato:", err);
    }
  }, [navigate]);

  // Get Telegram user info
  useEffect(() => {
    try {
      WebApp.ready();
      const tgUser =
        WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
      const tgUserId =
        WebApp?.initDataUnsafe?.user?.id ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (tgUser) {
        const clean = tgUser.replace("@", "");
        setUsername(clean);
      }
      if (tgUserId) {
        setUserId(String(tgUserId));
        loadHistory(String(tgUserId));
      }
    } catch (err) {
      console.error("Telegram error:", err);
    }
  }, []);

  // Load user history by userId (owner_user_id)
  const loadHistory = async (uid) => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(`/api/user/history/${uid}`);
      const json = await res.json();

      const orders = json || [];
      setHistory(orders);
    } catch (err) {
      console.error("History error:", err);
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  // Helper for status text and class
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { label: t("stars.paymentPending") || "Kutilmoqda", class: "pending", filterKey: "pending" };
      case "delivered":
        return { label: "Yetkazildi", class: "success", filterKey: "success" };
      case "processing":
        return { label: "Jarayonda", class: "pending", filterKey: "pending" };
      case "failed":
      case "error":
        return { label: t("stars.paymentFailed") || "Bekor qilindi", class: "failed", filterKey: "failed" };
      case "expired":
        return { label: "Eskirgan", class: "expired", filterKey: "expired" };
      default:
        return { label: status, class: "default", filterKey: "all" };
    }
  };

  // Filter history based on selected filter
  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    const statusInfo = getStatusInfo(item.status);
    return statusInfo.filterKey === filter;
  });

  return (
    <div className="history-page">
      {/* Header with Sticker */}
      <div className="history-header centered-header">
        <div className="history-sticker-container">
           <TGSSticker stickerPath={buyurtmalarSticker} className="history-sticker" />
        </div>
        <h1>Premium Buyurtmalar</h1>
      </div>

      {/* Filter Tabs */}
      <div className="history-filter-tabs">
        <button 
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Barchasi
        </button>
        <button 
          className={`filter-tab filter-success ${filter === "success" ? "active" : ""}`}
          onClick={() => setFilter("success")}
        >
          ✓ Yetkazildi
        </button>
        <button 
          className={`filter-tab filter-failed ${filter === "failed" ? "active" : ""}`}
          onClick={() => setFilter("failed")}
        >
          ✕ Muvaffaqiyatsiz
        </button>
        <button 
          className={`filter-tab filter-expired ${filter === "expired" ? "active" : ""}`}
          onClick={() => setFilter("expired")}
        >
          ⏱ Eskirgan
        </button>
        <button 
          className={`filter-tab filter-pending ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ Kutilmoqda
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>{t("common.loading")}</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-text">{filter === "all" ? (t("dashboard.noOrders")) : `Bu kategoriyada buyurtma yo'q`}</p>
          <p className="empty-hint">{t("history.emptyHint") || "Buyurtmalaringiz shu yerda ko'rinadi"}</p>
        </div>
      ) : (
        <div className="history-list-container">
          <ul className="history-list">
            {filteredHistory.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const isPending = statusInfo.filterKey === "pending";
              return (
                <li key={`${item.kind}-${item.id}`} className={`history-item item-${statusInfo.class} ${isPending ? "item-pending-anim" : ""}`}>
                  <div className={`history-badge ${item.kind}`}>
                    {isPending ? (
                      <div className="pending-spinner"></div>
                    ) : (
                      <img 
                        src={premiumGif} 
                        alt={item.kind} 
                        className="history-icon-img"
                      />
                    )}
                  </div>

                  <div className="history-content">
                    <div className="history-row">
                      <span className="history-title">
                        Premium {item.months} oy
                      </span>
                      <span className={`history-amount`}>
                        {formatAmount(item.amount)} so'm
                      </span>
                    </div>

                    <div className="history-row meta-row">
                      <span className="history-date">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className={`history-status-badge status-${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
