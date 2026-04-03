import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import WebApp from "@twa-dev/sdk";
import apiFetch from "../../utils/apiFetch";
import premiumGif from "../../assets/premium_gif.gif";
import "./Statistics.css";

const formatAmount = (num) =>
  Number(num || 0).toLocaleString("ru-RU");

export default function Statistics() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [username, setUsername] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [period, setPeriod] = useState("daily");
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Telegram user
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.setHeaderColor("#1a1a2e");
      WebApp.setBackgroundColor("#1a1a2e");

      // Back button
      const handleBack = () => navigate("/");
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(handleBack);

      const tgUser =
        WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;

      if (tgUser) {
        const clean = tgUser.replace("@", "");
        setUsername(clean);
        setIsTelegram(true);
      }

      return () => {
        try { 
          WebApp.BackButton.offClick(handleBack);
          WebApp.BackButton.hide(); 
        } catch {}
      };
    } catch {
      setIsTelegram(false);
    }
  }, [navigate]);

  // Load sales leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (username) params.set("username", username);
        if (period !== "all") params.set("period", period);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await apiFetch(`/api/stats/leaderboard${qs}`);
        const json = await res.json();
        setLeaderboard(json.top10 || []);
        setMyRank(json.me || null);
      } catch {
        setError(t("statistics.loadError") || "Statistikani yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [username, period]);

  const getMedal = (i) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  return (
    <div className="statistics-root">
      {/* Header */}
      <header className="statistics-header">
        <h1 className="statistics-title">
          🏆 {t("statistics.title") || "Premium Statistika"}
        </h1>
        <p className="statistics-subtitle" style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
          Premium sotib olgan foydalanuvchilar reytingi
        </p>
      </header>

      {/* Content */}
      <div className="statistics-content">

        {/* Period Filter */}
        <div className="statistics-period-filters">
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              className={`statistics-period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {t(`statistics.period_${p}`) || 
                (p === "daily" ? "Bugun" : p === "weekly" ? "Hafta" : "Oy")
              }
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="statistics-skeleton">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="statistics-skeleton-row"></div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <p className="statistics-error">{error}</p>}

        {/* Sales Leaderboard */}
        {!loading && !error && (
          <>
            {leaderboard.length === 0 ? (
              <div className="statistics-empty">
                {t("statistics.noOrders") || "Hozircha ma'lumot yo'q"}
              </div>
            ) : (
              <div className="statistics-list">
                {leaderboard.map((u, i) => (
                  <div
                    key={u.owner_user_id || i}
                    className={`statistics-row ${i < 3 ? `top-${i + 1}` : ""}`}
                  >
                    <span className="statistics-rank">{getMedal(i)}</span>
                    <span className="statistics-user">{u.nickname}</span>
                    <span className="statistics-value">
                      {formatAmount(u.total)} so'm
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* My rank */}
            {isTelegram && (
              <div className="statistics-my-section">
                <div className="statistics-my-label">
                  {t("statistics.myPosition") || "Sizning o'rningiz"}
                </div>
                {myRank ? (
                  <div className="statistics-row me">
                    <span className="statistics-rank">#{myRank.rank}</span>
                    <span className="statistics-user">
                      {myRank.nickname}
                    </span>
                    <span className="statistics-value">
                      {formatAmount(myRank.total)} so'm
                    </span>
                  </div>
                ) : (
                  <div className="statistics-empty small">
                    {t("statistics.noPurchases") || "Siz hali xarid qilmagansiz"}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
