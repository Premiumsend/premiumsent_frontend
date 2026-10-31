import React, { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { useGo } from "../../ui/nav";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import { SUPPORT_TELEGRAM_URL, SUPPORT_TELEGRAM_USERNAME } from "../../utils/supportContact";
import { LanguageModal, Shell, Tabs, fill, openLink } from "../../ui/Kit";
import { BellIcon, ChannelIcon, ChevronRight, GlobeIcon, OrdersIcon, SupportIcon, TgStar, UsersIcon } from "../../ui/Brand";

// Bo'limga qaytganda ma'lumot darhol ko'rinadi, orqada yangilanadi
let cachedUser = null;
let cachedUnread = 0;

export default function Profile() {
  const { t, language } = useTranslation();
  const go = useGo();
  const [user, setUser] = useState(cachedUser || {
    username: localStorage.getItem("username") || "User",
    photo_url: null,
    balance: 0,
    friends: 0
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [unread, setUnread] = useState(cachedUnread);

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
          setUser(prev => {
            cachedUser = {
              ...prev,
              username,
              photo_url: photoUrl,
              balance: data.referral_balance || 0,
              friends: data.total_referrals || 0
            };
            return cachedUser;
          });
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
        .then((json) => {
          if (json.success) {
            cachedUnread = json.unread_count || 0;
            setUnread(cachedUnread);
          }
        })
        .catch(() => {});
    }
  }, []);

  const rows = [
    [
      [GlobeIcon, t("profile.language"), langLabels[language], () => setShowLanguageModal(true)],
      [OrdersIcon, t("profile.myOrders"), t("profile.myOrdersDesc"), () => go("/history", "tab-prev")],
      [BellIcon, t("notifications.title"), unread > 0 ? fill(t("ui.unread"), { n: unread }) : t("notifications.subtitle"), () => go("/notifications")],
    ],
    [
      [TgStar, t("ui.refBalance"), fill(t("ui.stars"), { n: user.balance }), () => go("/referral")],
      [UsersIcon, t("ui.friends"), fill(t("ui.countOf"), { n: user.friends }), () => go("/referral")],
    ],
    [
      [SupportIcon, t("ui.support"), `@${SUPPORT_TELEGRAM_USERNAME}`, () => openLink(SUPPORT_TELEGRAM_URL)],
      [ChannelIcon, t("profile.channel"), "@premiumsenduz", () => openLink("https://t.me/premiumsenduz")],
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
