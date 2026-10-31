import React, { useEffect, useState, useRef } from "react";
import apiFetch from "../../utils/apiFetch";
import { useTranslation } from "../../context/LanguageContext";
import { Dust, PromoField, RecipientField, Shell, fill, fmt } from "../../ui/Kit";
import { ChevronDown, TgStar } from "../../ui/Brand";
import { Confirm, Status, Transfer } from "../../ui/Payment";
import { useGo } from "../../ui/nav";
import {
  isCardDeliveryVariant,
  starsApiPrefix,
} from "../../utils/starsPurchaseRoute";
import {
  isPaymeeInsufficientError,
  paymeeInsufficientAlertMessage,
} from "../../utils/paymeeErrors";
import { PaymeeStockBanner } from "../../components/PaymeeStockBanner";
import { PaymeeStockAlert } from "../../components/PaymeeStockAlert";
import "./Stars.css";

import WebApp from "@twa-dev/sdk";

const STAGE_OF = {
  pending: "pending",
  payment_received: "received",
  processing: "received",
  stars_sent: "success",
  failed: "failed",
  error: "failed",
  expired: "expired",
};

// 8 daqiqa = 480 sekund
const POLLING_DURATION = 8 * 60 * 1000; // 8 daqiqa millisekondda

export function StarsPurchasePage({ variant = "robynhood" }) {
  const isFragment = variant === "fragment";
  const isPaymee = variant === "paymee";
  const isCardFlow = isCardDeliveryVariant(variant);
  const starsApi = starsApiPrefix(variant);
  const NARX = parseInt(import.meta.env.VITE_NARX) || 300;

  // Stars options
  const STARS_OPTIONS = [50, 100, 200, 350, 500, 750, 1000, 2000, 5000, 10000];

  const [username, setUsername] = useState("");
  const [stars, setStars] = useState("");
  const [price, setPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [txId, setTxId] = useState(null);
  // Buyurtma ochilmadi: "busy" (slotlar band)
  const [orderIssue, setOrderIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [timer, setTimer] = useState(20);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [countdown, setCountdown] = useState(480); // 8 daqiqa
  const [showMorePlans, setShowMorePlans] = useState(false);
  const [stockUnavailableMessage, setStockUnavailableMessage] = useState("");
  const [paymeeStockModal, setPaymeeStockModal] = useState(null);

  // Promocode state
  const [pramacod, setPramacod] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Refs for polling (modal yopilsa ham davom etadi)
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  const go = useGo();
  const { t } = useTranslation();

  const goToHome = () => {
    setShowModal(false);
    go("/", "back");
  };

  // 🔹 Telegramdan username olish
  const fillMyUsername = () => {
    try {
      const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
      if (!tgUser) {
        alert(t("ui.tgNoUser"));
        return;
      }
      setUsername(tgUser);
    } catch (err) {
      console.error("Telegram username olishda xato:", err);
    }
  };

  // Backend status
  useEffect(() => {
    const handleBack = () => {
      if (showModal) {
        setShowModal(false);
      } else if (showWarningModal) {
        setShowWarningModal(false);
      } else {
        go("/", "back");
      }
    };

    try {
      WebApp.ready();
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(handleBack);
    } catch (e) {
      console.warn("Telegram WebApp not ready", e);
    }

    return () => {
      try {
        if (!showModal && !showWarningModal) {
          WebApp.BackButton.offClick(handleBack);
          WebApp.BackButton.hide();
        }
      } catch (e) {}
    };
  }, [showModal, showWarningModal, go]);

  // Stars price - backend dan slot-based narx olish
  useEffect(() => {
    // Reset promo when stars change
    setAppliedPromo(null);
    setPromoMessage("");
    
    if (!stars || parseInt(stars) < 50 || parseInt(stars) > 10000) {
      setPrice(0);
      return;
    }
    
    const starNum = parseInt(stars);
    setPriceLoading(true);
    
    // Slot-based narx - backend dan olish
    apiFetch(isCardFlow ? `${starsApi}/price/${starNum}` : `/api/stars/price/${starNum}`)
      .then(res => res.json())
      .then(data => {
        if (data.available && data.price) {
          setPrice(data.price);
          setStockUnavailableMessage("");
        } else {
          setPrice(0);
          if (isPaymeeInsufficientError(data)) {
            setStockUnavailableMessage(paymeeInsufficientAlertMessage(data, "stars"));
          } else {
            setStockUnavailableMessage("");
          }
        }
      })
      .catch(() => {
        // Xato bo'lsa fallback
        setPrice(starNum * NARX);
      })
      .finally(() => setPriceLoading(false));
  }, [stars, isCardFlow, starsApi]);

  // Timer for stars_sent
  useEffect(() => {
    if (status === "stars_sent") {
      const countdownInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [status]);

  // Profil: RobynHood API yoki Fragment (faqat username)
  useEffect(() => {
    if (!username) {
      setProfile(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingProfile(true);
        const cleanUsername = username.startsWith("@")
          ? username.slice(1)
          : username;

        if (isFragment) {
          if (/^[a-zA-Z0-9_]{4,32}$/.test(cleanUsername)) {
            setProfile({ username: cleanUsername, recipient: cleanUsername });
          } else {
            setProfile(null);
          }
          return;
        }

        const starNum = parseInt(stars, 10);
        const searchUrl = isPaymee
          ? `${starsApi}/search`
          : "/api/search";
        const searchBody = isPaymee
          ? { username: cleanUsername, stars: Number.isInteger(starNum) ? starNum : 50 }
          : { username: cleanUsername };

        const profileRes = await apiFetch(searchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchBody),
        });

        const data = await profileRes.json();
        if (profileRes.ok) setProfile(data);
        else setProfile(null);
      } catch (err) {
        console.error("❌ Profil qidiruv xato:", err);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }, isFragment ? 300 : 1000);

    return () => clearTimeout(timeout);
  }, [username, isFragment, isPaymee, stars, starsApi]);

  // Check promocode
  const handleCheckPromo = async () => {
    if (!pramacod) return;
    setPromoMessage("");
    if (!stars) {
      setPromoError(true);
      setPromoMessage(t("ui.starsPick"));
      return;
    }
    try {
      const res = await apiFetch("/api/promocode/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: pramacod,
          type: "stars",
          amount: stars,
          price: price, // oyna uchun ko'rsatish
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPromoError(false);
        setPromoMessage(data.message);
        setAppliedPromo({ code: pramacod, newPrice: data.new_price });
      } else {
        setPromoError(true);
        setPromoMessage(data.error);
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError(true);
      setPromoMessage(t("ui.errGeneric"));
      setAppliedPromo(null);
    }
  };

  // ============================================
  // 🔄 PERSISTENT POLLING - Modal yopilsa ham davom etadi
  // ============================================

  // Sahifa yuklanganda saqlangan buyurtmani tekshirish
  useEffect(() => {
    const savedOrder = localStorage.getItem("pendingStarsOrder");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const createdAt = new Date(parsed.createdAt).getTime();
        const now = Date.now();
        const elapsed = now - createdAt;

        // 8 daqiqa o'tmagan bo'lsa, polling davom etadi
        if (elapsed < POLLING_DURATION) {
          setOrder(parsed.order);
          setStatus(parsed.status || "pending");

          // Qolgan vaqtni hisoblash
          const remainingMs = POLLING_DURATION - elapsed;
          const remainingSec = Math.floor(remainingMs / 1000);
          setCountdown(remainingSec);

          // Polling davom ettiramiz
          startPolling(parsed.order);
          startCountdownTimer(remainingSec);

          // Agar status pending/payment_info bo'lsa, modalni ochamiz
          if (parsed.status === "payment_info" || parsed.status === "pending" || parsed.status === "payment_received") {
            setShowModal(true);
          }

          console.log("📦 Avvalgi buyurtma topildi, polling davom etmoqda...");
        } else {
          // 8 daqiqa o'tgan, buyurtmani o'chiramiz
          localStorage.removeItem("pendingStarsOrder");
        }
      } catch (e) {
        localStorage.removeItem("pendingStarsOrder");
      }
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  // Polling boshlash (modal yopilsa ham davom etadi)
  const startPolling = (orderData) => {
    stopPolling(); // Avvalgisini to'xtatamiz

    pollingRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/transactions/${orderData.id}`);
        const data = await res.json();

        if (data.status !== status) {
          setStatus(data.status);

          // LocalStorage ni yangilaymiz
          const saved = localStorage.getItem("pendingStarsOrder");
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.status = data.status;
            localStorage.setItem("pendingStarsOrder", JSON.stringify(parsed));
          }
        }

        // ✅ Stars yuborildi
        if (data.status === "stars_sent") {
          stopPolling();
          stopCountdown();
          localStorage.removeItem("pendingStarsOrder");
          setTxId(data.transaction_id);
          setShowModal(true); // Muvaffaqiyat modalini ko'rsatish
        }

        // ❌ Expired yoki failed
        if (["expired", "failed", "error"].includes(data.status)) {
          stopPolling();
          stopCountdown();
          localStorage.removeItem("pendingStarsOrder");
          if (data.status === "failed" || data.status === "error") {
            setErrorMessage(data.error_message || data.reason || data.error || t("ui.unexpected"));
          }
        }
      } catch (err) {
        console.error("⚠️ Status olish xato:", err);
      }
    }, 3000); // Har 3 sekundda tekshirish
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Countdown timer (8 daqiqa)
  const startCountdownTimer = (initialSeconds = 480) => {
    stopCountdown();
    setCountdown(initialSeconds);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          stopPolling();
          localStorage.removeItem("pendingStarsOrder");
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Buyurtmani localStorage ga saqlash
  const saveOrderToStorage = (orderData) => {
    const data = {
      order: orderData,
      createdAt: new Date().toISOString(),
      status: "payment_info",
    };
    localStorage.setItem("pendingStarsOrder", JSON.stringify(data));
  };

  // "To'lov qildim" tugmasi bosilganda
  const handlePaymentDone = () => {
    setStatus("pending");
    // LocalStorage ni yangilaymiz
    const saved = localStorage.getItem("pendingStarsOrder");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.status = "pending";
      localStorage.setItem("pendingStarsOrder", JSON.stringify(parsed));
    }
  };

  // 💳 Create order
  const handlePayment = async () => {
    const starNum = parseInt(stars);
    
    if (!stars || starNum < 50 || starNum > 10000) {
      alert(t("ui.starsRangeErr"));
      return;
    }

    if (!username) {
      alert(t("ui.enterUsername"));
      return;
    }

    const cleanUsername = (profile?.username || username || "")
      .replace(/^@/, "")
      .trim();

    if (!cleanUsername) {
      alert(t("ui.enterUsername"));
      return;
    }

    if (!isCardFlow && (!profile || !profile.recipient)) {
      alert(t("ui.userNotFound"));
      return;
    }

    try {
      const payload = isCardFlow
        ? {
            username: cleanUsername,
            stars: parseInt(stars, 10),
            ...(isPaymee && price > 0 ? { slot_price: price } : {}),
            ...(isPaymee && appliedPromo?.newPrice != null
              ? { final_amount: appliedPromo.newPrice }
              : {}),
          }
        : {
            username: profile.username,
            recipient: profile.recipient,
            stars: parseInt(stars, 10),
          };

      if (appliedPromo) {
        payload.applied_promocode = appliedPromo.code;
      }

      const res = await apiFetch(isCardFlow ? `${starsApi}/order` : "/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Error tekshirish
      if (!res.ok) {
        const errorData = await res.json();
        
        // SLOTS_FULL xatosi
        if (errorData.code === "SLOTS_FULL") {
          setOrderIssue("busy");
          return;
        }

        if (isPaymeeInsufficientError(errorData)) {
          setPaymeeStockModal(paymeeInsufficientAlertMessage(errorData, "stars"));
          return;
        }
        
        throw new Error(errorData.error || t("ui.errServer"));
      }

      const newOrder = await res.json();
      setOrder(newOrder);
      setStatus("payment_info");
      
      // Birinchi ogohlantirish modalini ko'rsatamiz
      setShowWarningModal(true);

      // LocalStorage ga saqlash (modal yopilsa ham polling davom etadi)
      saveOrderToStorage(newOrder);

      // Polling va countdown boshlash
      startPolling(newOrder);
      startCountdownTimer(480); // 8 daqiqa
    } catch (err) {
      console.error("❌ Order yaratishda xato:", err);
      alert(err.message || t("ui.orderFail"));
    }
  };

  // "Tushundim" tugmasi bosilganda - ogohlantirish modalini yopib, to'lov modalini ochamiz
  const handleWarningUnderstood = () => {
    setShowWarningModal(false);
    setShowModal(true);
  };

  const starCount = parseInt(stars, 10) || 0;
  const validStars = starCount >= 50 && starCount <= 10000;
  const recipientName = profile?.username || username.replace(/^@/, "").trim() || order?.username || "";
  const som = t("ui.som");
  const productName = fill(t("ui.stars"), { n: fmt(order?.stars) });
  const total = appliedPromo ? appliedPromo.newPrice : price;
  const stage = STAGE_OF[status];
  const closePayment = () => { setShowModal(false); stopPolling(); stopCountdown(); };
  const buyDisabled =
    Boolean(stockUnavailableMessage) ||
    !validStars ||
    priceLoading ||
    !username.trim() ||
    (!isCardFlow && !profile?.recipient);

  const packRow = (pack, i) => (
    <button key={pack} type="button" className={`pn-starrow ${starCount === pack ? "is-active" : ""}`} onClick={() => setStars(String(pack))}>
      <span className="pn-stack">{Array.from({ length: Math.min(i + 1, 6) }, (_, n) => <TgStar key={n} size={26} outline />)}</span>
      <span className="pn-starrow__n">{fmt(pack)}</span>
      <span className="pn-starrow__p">{fmt(pack * NARX)} {som}</span>
    </button>
  );

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--bar">
        <div className="pn-pagehero pn-pagehero--gold">
          <span className="pn-star-dust pn-star-dust--gold"><TgStar size={60} /><Dust /></span>
          <h1>Telegram Stars</h1>
          <p>{t("ui.starsSub")}</p>
        </div>

        <RecipientField
          username={username}
          setUsername={setUsername}
          onMe={fillMyUsername}
          loading={loadingProfile}
          profile={profile?.fullName ? profile : null}
        />

        <section className="pn-field">
          <label htmlFor="pn-stars">{t("ui.amount")}</label>
          <div className="pn-input pn-input--plain">
            <input
              id="pn-stars"
              inputMode="numeric"
              value={stars}
              onChange={(e) => setStars(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder={t("ui.starsRange")}
            />
            <em>{validStars && price > 0 ? `${fmt(price)} ${som}` : ""}</em>
          </div>
          {stars && !validStars && <p className="pn-error">{t("ui.starsRangeErr")}</p>}
        </section>

        <div className="pn-starlist">
          {STARS_OPTIONS.slice(0, 3).map(packRow)}
          <div className={`pn-starmore ${showMorePlans ? "is-open" : ""}`}>
            <div>{STARS_OPTIONS.slice(3).map((pack, i) => packRow(pack, i + 3))}</div>
          </div>
          <button type="button" className={`pn-starlist__toggle ${showMorePlans ? "is-open" : ""}`} onClick={() => setShowMorePlans((m) => !m)}>
            {showMorePlans ? t("ui.less") : t("ui.more")} <ChevronDown size={17} />
          </button>
        </div>

        {stockUnavailableMessage && <PaymeeStockBanner product="stars" message={stockUnavailableMessage} />}

        <div className="pn-gap" />
        <PromoField code={pramacod} setCode={setPramacod} message={promoMessage} isError={promoError} applied={Boolean(appliedPromo)} onApply={handleCheckPromo} />
      </div>

      <div className="pn-bar">
        <span className="pn-bar__total"><small>{t("ui.total")}</small><b>{validStars && total > 0 ? `${fmt(total)} ${som}` : "—"}</b></span>
        <button type="button" className="pn-cta" disabled={buyDisabled} onClick={handlePayment}>{t("ui.buy")}</button>
      </div>

      {paymeeStockModal && (
        <PaymeeStockAlert product="stars" message={paymeeStockModal} onClose={() => setPaymeeStockModal(null)} />
      )}

      {showWarningModal && order && (
        <Confirm product={productName} recipient={recipientName} amount={order.amount} onContinue={handleWarningUnderstood} />
      )}

      {showModal && order && status === "payment_info" && (
        <Transfer amount={order.amount} item="stars" countdown={countdown} onClose={closePayment} onPaid={handlePaymentDone} />
      )}

      {showModal && order && stage && (
        <Status
          stage={stage}
          item="stars"
          product={productName}
          recipient={recipientName}
          amount={order.amount}
          countdown={countdown}
          orderId={order.id}
          txId={txId}
          errorText={errorMessage}
          note={stage === "success" ? fill(t("ui.autoClose"), { n: timer }) : ""}
          onClose={closePayment}
          onDone={goToHome}
          onRetry={closePayment}
        />
      )}

      {orderIssue && (
        <Status
          sheet
          stage={orderIssue}
          item="stars"
          onClose={() => setOrderIssue(null)}
          onRetry={() => { setOrderIssue(null); handlePayment(); }}
        />
      )}
    </Shell>
  );
}

export default function Stars() {
  return <StarsPurchasePage variant="robynhood" />;
}
