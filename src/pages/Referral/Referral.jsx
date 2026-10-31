import React, { useEffect, useState } from "react";
import { useGo } from "../../ui/nav";

import WebApp from "@twa-dev/sdk";
import { useTranslation } from "../../context/LanguageContext";
import { TGSSticker } from "../../components/TGSSticker";
import apiFetch from "../../utils/apiFetch";
import { Modal, Shell, dateLocale, fill } from "../../ui/Kit";
import { CheckIcon, CopyIcon, TgStar } from "../../ui/Brand";

// Gift IDlar - referral yechish uchun (minimum 50 stars)
const GIFTS = [
  { id: "5170144170496491616", stars: 50 },
  { id: "5170314324215857265", stars: 50 },
  { id: "5170564780938756245", stars: 50 },
  { id: "6028601630662853006", stars: 50 },
  { id: "5922558454332916696", stars: 50 },
  { id: "5801108895304779062", stars: 50 },
  { id: "5800655655995968830", stars: 50 },
  { id: "5956217000635139069", stars: 50 },
  { id: "5935895822435615975", stars: 50 },
  { id: "5969796561943660080", stars: 50 },
  { id: "5168043875654172773", stars: 100 },
  { id: "5170690322832818290", stars: 100 },
  { id: "5170521118301225164", stars: 100 },
];

// Gift ID dan TGS sticker path olish
const getGiftStickerPath = (giftId) => {
  return new URL(`../../assets/${giftId}.tgs`, import.meta.url).href;
};

export default function Referral() {
  const go = useGo();
  const { t, language } = useTranslation();
  // State
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  // Stats
  const [stats, setStats] = useState({
    referral_balance: 0,
    total_earnings: 0,
    total_referrals: 0,
    som_balance: 0,
  });
  const [earnings, setEarnings] = useState([]);
  const [claiming, setClaiming] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // My friends state (referrer_username orqali)
  const [myFriends, setMyFriends] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

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

  // Get Telegram user info
  useEffect(() => {
    const initTelegram = async () => {
      try {
        WebApp.ready();
        const tgUser = WebApp?.initDataUnsafe?.user;

        if (tgUser?.id) {
          const tgUserId = String(tgUser.id);
          setUserId(tgUserId);
          localStorage.setItem("userId", tgUserId);
          
          if (tgUser.username) {
            const clean = tgUser.username.replace("@", "");
            setUsername(clean);
            localStorage.setItem("username", clean);
          }
          
          registerUser(tgUserId);
        }
      } catch (err) {
        console.error("Telegram error:", err);
      }
    };
    initTelegram();
  }, []);

  // Register user with referral code
  const registerUser = async (user) => {
    try {
      // Check URL parameters for referral code
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref");

      const res = await apiFetch("/api/referral/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          referral_code: refCode || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReferralCode(data.referral_code);
      }

      // Load referral link and stats
      loadReferralData(user);
    } catch (err) {
      console.error("Register error:", err);
    }
  };

  // Load referral link
  const loadReferralData = async (user) => {
    try {
      setLoading(true);

      // Promise.allSettled API calls
      const [linkRes, statsRes, earningsRes, friendsCountRes, myFriendsRes] = await Promise.allSettled([
        apiFetch(`/api/referral/link/${user}`),
        apiFetch(`/api/referral/stats/${user}`),
        apiFetch(`/api/referral/earnings/${user}`),
        apiFetch(`/api/referral/friends-count/${user}`),
        apiFetch(`/api/referral/my-friends/${user}`)
      ]);

      // Process responses
      if (linkRes.status === "fulfilled" && linkRes.value.ok) {
        const linkData = await linkRes.value.json();
        setReferralCode(linkData.referral_code);
        setReferralLink(linkData.referral_link);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setStats(statsData);
      }

      if (earningsRes.status === "fulfilled" && earningsRes.value.ok) {
        const earningsData = await earningsRes.value.json();
        setEarnings(earningsData.earnings || []);
      }

      // Friends count (referrer_username orqali)
      if (friendsCountRes.status === "fulfilled" && friendsCountRes.value.ok) {
        const fcData = await friendsCountRes.value.json();
        setFriendsCount(fcData.friends_count || 0);
      }

      // My friends list
      if (myFriendsRes.status === "fulfilled" && myFriendsRes.value.ok) {
        const mfData = await myFriendsRes.value.json();
        setMyFriends(mfData.friends || []);
        setPendingCount(mfData.pending_count || 0);
      }

    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share function - Telegram Forward menu
  const shareLink = () => {
    if (!referralLink) return;

    try {
      // Text birinchi, keyin link - hammasi text ichida
      const fullMessage = `${t("ui.shareMsg")}\n\n${referralLink}`;
      
      // URL parametriga bo'sh string, text parametriga to'liq xabar
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(fullMessage)}`;
      
      // Open Telegram share dialog
      WebApp.openTelegramLink(shareUrl);
    } catch (err) {
      console.error("Share error:", err);
      // Fallback: copy to clipboard
      copyLink();
    }
  };

  // Withdraw referral balance as gift
  const handleWithdraw = async () => {
    if (!selectedGift || withdrawing) return;
    
    try {
      setWithdrawing(true);
      const res = await apiFetch("/api/referral/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: selectedGift.id }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setWithdrawSuccess(true);
        // Update balance
        setStats(prev => ({
          ...prev,
          referral_balance: data.new_balance
        }));
        // Reset after 3 seconds
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawSuccess(false);
          setSelectedGift(null);
        }, 3000);
      } else {
        alert(data.error || t("ui.errGeneric"));
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      alert(t("ui.errServer"));
    } finally {
      setWithdrawing(false);
    }
  };

  // Open withdraw modal
  const openWithdrawModal = () => {
    setSelectedGift(null);
    setWithdrawSuccess(false);
    setShowWithdrawModal(true);
  };

  // Check if gift is affordable
  const canAfford = (gift) => stats.referral_balance >= gift.stars;

  return (
    <Shell>
      <div className="pn-scroll">
        <h1 className="pn-title">{t("ui.refTitle")}</h1>

        {loading ? (
          <div className="pn-empty"><div className="pn-spin" /></div>
        ) : (
          <>
            <div className="pn-balance">
              <div><small>{t("ui.refBalance")}</small><strong><TgStar size={30} /> {stats.referral_balance}</strong></div>
              <button type="button" className="pn-cta pn-cta--sm" onClick={openWithdrawModal}>{t("ui.withdraw")}</button>
              <p><span>{t("ui.friends")}</span><b>{fill(t("ui.countOf"), { n: friendsCount })}{pendingCount > 0 && ` (${fill(t("ui.pendingN2"), { n: pendingCount })})`}</b></p>
            </div>

            <h2 className="pn-h2">{t("ui.howBonus")}</h2>
            <ul className="pn-rules">
              <li><i>1</i><span>{t("ui.r1")}</span><b>+2</b></li>
              <li><i>2</i><span>{t("ui.r2")}</span><b>+5</b></li>
              <li><i>3</i><span>{t("ui.r3")}</span><b>+15</b></li>
            </ul>

            <h2 className="pn-h2">{t("ui.yourLink")}</h2>
            <button type="button" className="pn-link" onClick={copyLink}>
              <span>{referralLink || "..."}</span>{copied ? <CheckIcon size={18} /> : <CopyIcon />}
            </button>
            <button type="button" className="pn-cta pn-cta--full" onClick={shareLink}>{t("ui.shareBtn")}</button>

            <h2 className="pn-h2">{t("ui.myFriends")}</h2>
            {myFriends.length === 0 ? (
              <p className="pn-hint">{t("ui.noFriends")}</p>
            ) : (
              <ul className="pn-friends">
                {myFriends.map((friend, idx) => (
                  <li key={idx}>
                    <span className="pn-avatar">{String(friend.username || friend.user_id).charAt(0).toUpperCase()}</span>
                    <span>
                      <b>@{friend.username || friend.user_id}</b>
                      {friend.subscribe_user ? new Date(friend.created_at).toLocaleDateString(dateLocale(language)) : t("ui.notSub")}
                    </span>
                    {friend.subscribe_user && <CheckIcon size={16} />}
                  </li>
                ))}
              </ul>
            )}

            <h2 className="pn-h2">{t("ui.earnTitle")}</h2>
            {earnings.length === 0 ? (
              <p className="pn-hint">{t("ui.noEarn")}</p>
            ) : (
              <ul className="pn-friends">
                {earnings.map((earning, idx) => (
                  <li key={idx}>
                    <span className="pn-avatar">{String(earning.referee_username || "?").charAt(0).toUpperCase()}</span>
                    <span><b>@{earning.referee_username}</b>{new Date(earning.created_at).toLocaleDateString(dateLocale(language))}</span>
                    <em>+{earning.earned_stars}</em>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {showWithdrawModal && (
        <Modal title={t("ui.giftPick")} onClose={() => !withdrawing && setShowWithdrawModal(false)}>
          <div className="pn-withdraw__info"><span>{t("ui.sendTo")}</span><b>@{username}</b></div>
          <div className="pn-withdraw__info"><span>{t("ui.yourBalance")}</span><b>{fill(t("ui.stars"), { n: stats.referral_balance })}</b></div>
          {withdrawSuccess ? (
            <div className="pn-withdraw__done">
              <TGSSticker stickerPath={getGiftStickerPath(selectedGift?.id)} className="pn-withdraw__art" autoplay />
              <b>{t("ui.giftSending")}</b>
              @{username}
            </div>
          ) : (
            <>
              <div className="pn-withdraw__grid">
                {GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    type="button"
                    className={selectedGift?.id === gift.id ? "is-active" : ""}
                    disabled={!canAfford(gift)}
                    onClick={() => setSelectedGift(gift)}
                  >
                    <TGSSticker stickerPath={getGiftStickerPath(gift.id)} className="pn-withdraw__art" autoplay={false} />
                    {fill(t("ui.stars"), { n: gift.stars })}
                  </button>
                ))}
              </div>
              <button type="button" className="pn-cta pn-cta--full" disabled={!selectedGift || withdrawing} onClick={handleWithdraw}>
                {withdrawing ? t("common.loading") : selectedGift ? fill(t("ui.withdrawN"), { n: selectedGift.stars }) : t("ui.giftChoose")}
              </button>
              <p className="pn-hint">{t("ui.giftHint")}</p>
            </>
          )}
        </Modal>
      )}
    </Shell>
  );
}
