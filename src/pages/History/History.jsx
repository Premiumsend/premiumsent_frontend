import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import WebApp from "@twa-dev/sdk";
import apiFetch from "../../utils/apiFetch";
import { Shell, Tabs, fmt } from "../../ui/Kit";
import { OrdersIcon, TgStar } from "../../ui/Brand";

const FILTERS = [["all", "Hammasi"], ["success", "Bajarildi"], ["pending", "Kutilmoqda"], ["failed", "Bekor"], ["expired", "Eskirgan"]];

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
      case "processing":
        return { label: "Kutilmoqda", class: "is-wait", filterKey: "pending" };
      case "stars_sent":
      case "premium_sent":
      case "completed":
      case "delivered":
      case "sent":
        return { label: "Bajarildi", class: "is-ok", filterKey: "success" };
      case "failed":
      case "error":
        return { label: "Bekor qilindi", class: "is-bad", filterKey: "failed" };
      case "expired":
        return { label: "Eskirgan", class: "is-muted", filterKey: "expired" };
      default:
        return { label: status, class: "is-muted", filterKey: "all" };
    }
  };

  // Filter history based on selected filter
  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    const statusInfo = getStatusInfo(item.status);
    return statusInfo.filterKey === filter;
  });

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--tabs">
        <h1 className="pn-title">Buyurtmalar</h1>
        <div className="pn-filters">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="pn-empty"><div className="pn-spin" /></div>
        ) : error ? (
          <div className="pn-empty"><b>{error}</b></div>
        ) : filteredHistory.length === 0 ? (
          <div className="pn-empty">
            <span><OrdersIcon size={26} /></span>
            <b>{filter === "all" ? "Buyurtmalar hali yo'q" : "Bu bo'limda buyurtma yo'q"}</b>
            Xaridlaringiz shu yerda ko'rinadi
            {filter === "all" && <button type="button" className="pn-cta" onClick={() => navigate("/")}>Xarid qilish</button>}
          </div>
        ) : (
          <ul className="pn-orders">
            {filteredHistory.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              // Backend turi: stars, stars_paymee, premium, premium_paymee
              const isStars = String(item.kind).startsWith("stars");
              return (
                <li key={`${item.kind}-${item.id}`}>
                  <span className={`pn-order__ic ${isStars ? "is-gold" : ""}`}><TgStar size={24} accent={!isStars} /></span>
                  <span className="pn-order__main">
                    <b>{isStars ? `${item.stars} Stars` : `Premium, ${item.stars} oy`}</b>
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="pn-order__side"><b>{fmt(item.amount)}</b><em className={statusInfo.class}>{statusInfo.label}</em></span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Tabs active="orders" />
    </Shell>
  );
}
