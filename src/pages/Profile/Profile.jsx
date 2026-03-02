import React, { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";

import adminIcon from "../../assets/admin_icon.png";
import bellsIcon from "../../assets/bells_icon.png";

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "User",
    photo_url: null,
    balance: 0,
    friends: 0
  });

  useEffect(() => {
    // 1. Get User from Telegram
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
    
    // Fallback
    const storedUser = localStorage.getItem("username");
    if (storedUser && (!WebApp.initDataUnsafe?.user?.username)) {
        username = storedUser;
    }

    // 2. Fetch Stats
    const fetchStats = async () => {
      try {
        const safeUsername = username.replace("@", "");
        const res = await apiFetch(`/api/referral/stats/${safeUsername}`);
        if (res.ok) {
          const data = await res.json();
          setUser(prev => ({
            ...prev,
            username: username,
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
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-container">
            {user.photo_url ? (
                <img src={user.photo_url} alt="Profile" className="profile-avatar" />
            ) : (
                <div className="profile-avatar-placeholder">
                    {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
            )}
        </div>
        <h2 className="profile-username">{user.username}</h2>
        <p className="profile-handle">@{user.username.replace("@", "")}</p>
      </div>

      <div className="profile-group">
        <a href="https://t.me/starsjoy_bot" target="_blank" rel="noopener noreferrer" className="profile-item-link">
            <div className="profile-item">
            <div className="profile-item-left">
                <div className="icon-circle icon-help">
                    <img src={adminIcon} alt="admin" className="profile-icon-img" />
                </div>
                <span>{t("profile.support") || "Yordam"}</span>
            </div>
            <div className="profile-item-right">
                <span className="blue-text">@starsjoy_bot</span>
                <span className="arrow">›</span>
            </div>
            </div>
        </a>

        <a href="https://t.me/starsjoy" target="_blank" rel="noopener noreferrer" className="profile-item-link">
            <div className="profile-item">
            <div className="profile-item-left">
                <div className="icon-circle icon-news">
                    <img src={bellsIcon} alt="news" className="profile-icon-img" />
                </div>
                <span>{t("profile.channel") || "Yangiliklar kanali"}</span>
            </div>
            <div className="profile-item-right">
                <span className="blue-text">@starsjoy</span>
                <span className="arrow">›</span>
            </div>
            </div>
        </a>
      </div>

      <div className="profile-group">
        <div className="profile-item" onClick={() => navigate("/referral")}>
          <div className="profile-item-left">
            <div className="icon-circle icon-balance">💲</div>
            <span>{t("referral.balance") || "Balans"}</span>
          </div>
          <div className="profile-item-right">
            <span className="blue-text">{user.balance} {t("referral.rewardStars") || "Stars"}</span>
            <span className="arrow">›</span>
          </div>
        </div>

        <div className="profile-item" onClick={() => navigate("/referral")}>
          <div className="profile-item-left">
            <div className="icon-circle icon-friends">👥</div>
            <span>{t("referral.friends") || "Do'stlar"}</span>
          </div>
          <div className="profile-item-right">
            <span className="blue-text">{user.friends}</span>
            <span className="arrow">›</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="profile-footer">
        <p className="footer-copyright">© 2026 Starsjoy</p>
        <p className="footer-rights">Barcha huquqlar himoyalangan</p>
        <div className="footer-divider"></div>
        <p className="footer-version">v3.1.1</p>
      </div>
    </div>
  );
}
