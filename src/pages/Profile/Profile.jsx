import React, { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import { SUPPORT_TELEGRAM_URL, SUPPORT_TELEGRAM_USERNAME } from "../../utils/supportContact";
import { LanguageModal, Shell, Tabs, openLink } from "../../ui/Kit";
import { BellIcon, ChannelIcon, ChevronRight, GlobeIcon, OrdersIcon, SupportIcon, TgStar, UsersIcon } from "../../ui/Brand";

export default function Profile() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "User",
    photo_url: null,
    balance: 0,
    friends: 0
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [unread, setUnread] = useState(0);

  const langLabels = { uz: "O'zbekcha", en: "English", ru: "Русский" };

  useEffect(() => {
    let username = "User";
    let photoUrl = null;

    try {
      if (WebApp.initDataUnsafe?.user) {
        username = WebApp.initDataUnsafe.user.username || WebApp.initDataUnsafe.user.first_name;
        photoUrl = WebApp.initDataUnsafe.user.photo_url;
      }
    } catch (e) {
      console.error("Telegram WebApp not ready");
    }

    const storedUser = localStorage.getItem("username");
    if (storedUser && (!WebApp.initDataUnsafe?.user?.username)) {
      username = storedUser;
    }

    const fetchStats = async () => {
      try {
        const safeUsername = username.replace("@", "");
        const res = await apiFetch(`/api/referral/stats/${safeUsername}`);
        if (res.ok) {
          const data = await res.json();
          setUser(prev => ({
            ...prev,
            username,
            photo_url: photoUrl,
            balance: data.referral_balance || 0,
            friends: data.total_referrals || 0
          }));
        } else {
          setUser(prev => ({ ...prev, username, photo_url: photoUrl }));
        }
      } catch (err) {
        console.error("Failed to fetch profile stats", err);
        setUser(prev => ({ ...prev, username, photo_url: photoUrl }));
      }
    };

    fetchStats();

    const uid = localStorage.getItem("userId");
    if (uid) {
      apiFetch(`/api/notifications/unread/${uid}`)
        .then((r) => r.json())
        .then((json) => { if (json.success) setUnread(json.unread_count || 0); })
        .catch(() => {});
    }
  }, []);

  const rows = [
    [
      [GlobeIcon, t("profile.language") || "Til", langLabels[language], () => setShowLanguageModal(true)],
      [OrdersIcon, t("profile.myOrders") || "Mening buyurtmalarim", t("profile.myOrdersDesc") || "Xaridlar tarixi", () => navigate("/history")],
      [BellIcon, t("notifications.title") || "Bildirishnomalar", unread > 0 ? `${unread} ta yangi` : (t("notifications.subtitle") || "Yangiliklar va xabarlar"), () => navigate("/notifications")],
    ],
    [
      [TgStar, t("referral.balance") || "Referal balans", `${user.balance} Stars`, () => navigate("/referral")],
      [UsersIcon, t("profile.friendsCount") || "Do'stlar soni", `${user.friends} ta`, () => navigate("/referral")],
    ],
    [
      [SupportIcon, t("profile.support") || "Yordam", `@${SUPPORT_TELEGRAM_USERNAME}`, () => openLink(SUPPORT_TELEGRAM_URL)],
      [ChannelIcon, t("profile.channel") || "Yangiliklar kanali", "@premiumsenduz", () => openLink("https://t.me/premiumsenduz")],
    ],
  ];

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--tabs">
        <div className="pn-me">
          {user.photo_url
            ? <img className="pn-avatar pn-avatar--xl" src={user.photo_url} alt="" />
            : <span className="pn-avatar pn-avatar--xl">{user.username ? user.username.charAt(0).toUpperCase() : "U"}</span>}
          <h1>{user.username}</h1>
          <p>@{user.username.replace("@", "")}</p>
        </div>
        {rows.map((group) => (
          <div key={group[0][1]} className="pn-group">
            {group.map(([Icon, title, sub, onClick]) => (
              <button key={title} type="button" onClick={onClick}>
                <span><Icon size={19} /></span>
                <span className="pn-group__text"><b>{title}</b>{sub}</span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        ))}
        <p className="pn-foot">© 2026 Premiumsend uz</p>
      </div>
      <Tabs active="profile" />
      {showLanguageModal && <LanguageModal onClose={() => setShowLanguageModal(false)} />}
    </Shell>
  );
}
