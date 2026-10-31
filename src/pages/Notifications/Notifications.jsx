import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import { Shell } from "../../ui/Kit";
import { BellIcon, CheckIcon, TgStar } from "../../ui/Brand";

const TYPE_ICONS = {
  success: ["is-ok", <CheckIcon key="ok" />],
  promo: ["is-gold", <TgStar key="promo" size={20} />],
};
const DEFAULT_ICON = ["is-info", <BellIcon key="bell" size={18} />];

// Format relative time
const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Hozir";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;

  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  // Telegram Mini App Back Button
  useEffect(() => {
    try {
      WebApp.BackButton.show();
      const handleBackClick = () => navigate("/profile");
      WebApp.BackButton.onClick(handleBackClick);

      return () => {
        WebApp.BackButton.offClick(handleBackClick);
        WebApp.BackButton.hide();
      };
    } catch (err) {
      console.error("BackButton error:", err);
    }
  }, [navigate]);

  // Get user ID
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) {
      setUserId(uid);
    }
  }, []);

  // Load notifications
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      try {
        const res = await apiFetch(`/api/notifications/${userId}`);
        const data = await res.json();

        if (data.success) {
          setNotifications(data.notifications || []);
          // Mark all as read
          await apiFetch(`/api/notifications/read-all/${userId}`, {
            method: "POST",
          });
        }
      } catch (err) {
        console.error("Load notifications error:", err);
      }
    };

    loadNotifications();
  }, [userId]);

  return (
    <Shell>
      <div className="pn-scroll">
        <h1 className="pn-title">{t("notifications.title") || "Bildirishnomalar"}</h1>
        {notifications.length === 0 ? (
          <div className="pn-empty">
            <span><BellIcon size={26} /></span>
            <b>{t("notifications.noNotifications") || "Bildirishnomalar yo'q"}</b>
            {t("notifications.emptyHint") || "Yangi xabarlar shu yerda ko'rinadi"}
          </div>
        ) : (
          <ul className="pn-notes">
            {notifications.map((notif) => {
              const [tone, icon] = TYPE_ICONS[notif.type] || DEFAULT_ICON;
              return (
                <li key={notif.id} className={notif.is_read ? "" : "is-unread"}>
                  <span className={`pn-notes__ic ${tone}`}>{icon}</span>
                  <span><b>{notif.title}</b>{notif.message}<small>{formatRelativeTime(notif.created_at)}</small></span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Shell>
  );
}
