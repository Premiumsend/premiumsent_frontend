import React, { useEffect, useState } from "react";
import { useGo } from "../../ui/nav";
import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import { Shell, dateLocale, fill } from "../../ui/Kit";
import { BellIcon, CheckIcon, TgStar } from "../../ui/Brand";

const TYPE_ICONS = {
  success: ["is-ok", <CheckIcon key="ok" />],
  promo: ["is-gold", <TgStar key="promo" size={20} />],
};
const DEFAULT_ICON = ["is-info", <BellIcon key="bell" size={18} />];

// Format relative time
const formatRelativeTime = (dateStr, t, language) => {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date) / 1000);

  if (diff < 60) return t("ui.now");
  if (diff < 3600) return fill(t("ui.minAgo"), { n: Math.floor(diff / 60) });
  if (diff < 86400) return fill(t("ui.hourAgo"), { n: Math.floor(diff / 3600) });
  if (diff < 604800) return fill(t("ui.dayAgo"), { n: Math.floor(diff / 86400) });

  return date.toLocaleDateString(dateLocale(language), { day: "2-digit", month: "short", year: "numeric" });
};

export default function Notifications() {
  const go = useGo();
  const { t, language } = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  // Telegram Mini App Back Button
  useEffect(() => {
    try {
      WebApp.BackButton.show();
      const handleBackClick = () => go("/profile", "back");
      WebApp.BackButton.onClick(handleBackClick);

      return () => {
        WebApp.BackButton.offClick(handleBackClick);
        WebApp.BackButton.hide();
      };
    } catch (err) {
      console.error("BackButton error:", err);
    }
  }, [go]);

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
        <h1 className="pn-title">{t("notifications.title")}</h1>
        {notifications.length === 0 ? (
          <div className="pn-empty">
            <span><BellIcon size={26} /></span>
            <b>{t("notifications.noNotifications")}</b>
            {t("notifications.emptyHint")}
          </div>
        ) : (
          <ul className="pn-notes">
            {notifications.map((notif) => {
              const [tone, icon] = TYPE_ICONS[notif.type] || DEFAULT_ICON;
              return (
                <li key={notif.id} className={notif.is_read ? "" : "is-unread"}>
                  <span className={`pn-notes__ic ${tone}`}>{icon}</span>
                  <span><b>{notif.title}</b>{notif.message}<small>{formatRelativeTime(notif.created_at, t, language)}</small></span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Shell>
  );
}
