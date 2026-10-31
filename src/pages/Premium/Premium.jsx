import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Premium.css";
import WebApp from "@twa-dev/sdk";
import apiFetch from "../../utils/apiFetch";
import { useTranslation } from "../../context/LanguageContext";
import { Dust, PromoField, RecipientField, Shell, fill, fmt } from "../../ui/Kit";
import { TgStar } from "../../ui/Brand";
import { Confirm, Status, Transfer } from "../../ui/Payment";
import { useGo } from "../../ui/nav";
import {
  isCardDeliveryVariant,
  premiumApiPrefix,
} from "../../utils/starsPurchaseRoute";
import {
  isPaymeeInsufficientError,
  paymeeInsufficientAlertMessage,
} from "../../utils/paymeeErrors";
import { PaymeeStockBanner } from "../../components/PaymeeStockBanner";
import { PaymeeStockAlert } from "../../components/PaymeeStockAlert";
const PLAN_TAGS = { 6: "ui.recommended", 12: "ui.best" };
const STAGE_OF = {
  pending: "pending",
  payment_received: "received",
  processing: "received",
  premium_sent: "success",
  failed: "failed",
  error: "failed",
  expired: "expired",
};

function normalizePremiumPollStatus(status) {
  if (status === "completed" || status === "delivered") return "premium_sent";
  return status;
}

export function PremiumPurchasePage({ variant = "robynhood" }) {
  const isFragment = variant === "fragment";
  const isPaymee = variant === "paymee";
  const isCardFlow = isCardDeliveryVariant(variant);
  const premiumApi = premiumApiPrefix(variant);
  const go = useGo();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const PREMIUM_3 = parseInt(import.meta.env.VITE_PREMIUM_3);
  const PREMIUM_6 = parseInt(import.meta.env.VITE_PREMIUM_6);
  const PREMIUM_12 = parseInt(import.meta.env.VITE_PREMIUM_12);

  // ====================
  // STATE
  // ====================
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const plans = [
    { id: 1, label: "3 oy", price: PREMIUM_3, months: 3 },
    { id: 2, label: "6 oy", price: PREMIUM_6, months: 6 },
    { id: 3, label: "1 yil", price: PREMIUM_12, months: 12 },
  ];

  const [selectedPlan, setSelectedPlan] = useState(plans[0]);

  useEffect(() => {
    const m = parseInt(searchParams.get("months"), 10);
    const match = plans.find((p) => p.months === m);
    if (match) setSelectedPlan(match);
  }, [searchParams]);

  const [order, setOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  const countdownRef = useRef(null);
  const pollingRef = useRef(null);
  /** Server yangi buyurtmani ham `pending` deb qaytaradi; UI esa "To'lov qildim" bosilguncha payment_info ko'rinishida qolishi kerak */
  const paymentDoneClickedRef = useRef(false);
  const [countdown, setCountdown] = useState(0);

  const [loadingBuy, setLoadingBuy] = useState(false);
  // Buyurtma ochilmadi: "busy" (slotlar band) yoki "error" (tarmoq/server)
  const [orderIssue, setOrderIssue] = useState(null);

  // Promocode states
  const [pramacod, setPramacod] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [fragmentPlanPrice, setFragmentPlanPrice] = useState(null);
  const [fragmentPriceLoading, setFragmentPriceLoading] = useState(false);
  const [fragmentSlotsFull, setFragmentSlotsFull] = useState(false);
  const [paymeeStockMessage, setPaymeeStockMessage] = useState("");
  const [paymeeStockModal, setPaymeeStockModal] = useState(null);

  // Back button functionality
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

  // Fragment: slot narxi backenddan (to'lov summasi mos bo'lishi uchun)
  useEffect(() => {
    if (!isCardFlow) {
      setFragmentPlanPrice(null);
      setFragmentSlotsFull(false);
      return;
    }

    setFragmentPriceLoading(true);
    apiFetch(`${premiumApi}/price/${selectedPlan.months}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.available && data.price) {
          setFragmentPlanPrice(data.price);
          setFragmentSlotsFull(false);
          setPaymeeStockMessage("");
        } else {
          setFragmentPlanPrice(null);
          setFragmentSlotsFull(true);
          setPaymeeStockMessage(
            isPaymeeInsufficientError(data) ? paymeeInsufficientAlertMessage(data, "premium") : ""
          );
        }
      })
      .catch(() => {
        setFragmentPlanPrice(null);
        setFragmentSlotsFull(false);
      })
      .finally(() => setFragmentPriceLoading(false));
  }, [isCardFlow, selectedPlan.months, premiumApi]);

  // Promokod narxi tanlangan muddatga bog'liq
  useEffect(() => {
    setAppliedPromo(null);
    setPromoMessage("");
  }, [selectedPlan.months]);

  // ================================
  // 🔍 PREMIUM SEARCH
  // ================================
  useEffect(() => {
    if (!username) {
      setProfile(null);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();

    const delay = setTimeout(async () => {
      try {
        setLoadingProfile(true);

        const clean = username.replace("@", "");

        const searchUrl = isCardFlow
          ? `${premiumApi}/search`
          : "/api/premium/search";
        const res = await apiFetch(searchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: clean,
            months: selectedPlan.months,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setProfile(null);
          setSearchError(data.error || t("ui.userNotFound"));
          return;
        }

        setProfile({
          username: data.username,
          fullName: data.fullName,
          imageUrl: data.imageUrl,
          recipient: data.recipient,
        });

        setSearchError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setSearchError(t("ui.errNet"));
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }, 500);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [username, selectedPlan, isFragment, isPaymee, premiumApi]);

  // 🔹 Telegramdan username olish
  const fillMyUsername = () => {
    try {
      const tgUser =
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;

      if (!tgUser) {
        alert(t("ui.tgNoUser"));
        return;
      }

      setUsername(tgUser);
    } catch (err) {
      console.error("Telegram username olishda xato:", err);
    }
  };

  // ================================
  // 🧾 ORDER YARATISH
  // ================================
  const handleCheckPromo = async () => {
    if (!pramacod) {
      setPromoMessage(t("ui.promoEnter"));
      setPromoError(true);
      return;
    }
    try {
      setPromoMessage(t("ui.promoChecking"));
      setPromoError(false);

      const res = await apiFetch("/api/promocode/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: pramacod, 
          type: "premium", 
          amount: selectedPlan.months,
          price: selectedPlan.price
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoMessage(data.error || t("ui.promoBad"));
        setPromoError(true);
        setAppliedPromo(null);
      } else {
        setPromoMessage(fill(t("ui.promoOk"), { n: data.discount_percent }));
        setPromoError(false);
        setAppliedPromo({
          code: pramacod,
          discount_percent: data.discount_percent,
          new_price: data.new_price
        });
      }
    } catch (err) {
      setPromoMessage(t("ui.errGeneric"));
      setPromoError(true);
      setAppliedPromo(null);
    }
  };

  const handleCreateOrder = async () => {

    const cleanUsername = (profile?.username || username || "").replace(/^@/, "").trim();
    if (!cleanUsername) {
      alert(t("ui.enterUsername"));
      return;
    }

    if (!isCardFlow && (!profile?.username || !profile?.recipient)) {
      alert(t("ui.userNotFound"));
      return;
    }

    if (isCardFlow && fragmentSlotsFull) {
      setOrderIssue("busy");
      return;
    }

    setLoadingBuy(true);

    try {
      const orderBody = isCardFlow
        ? {
            username: cleanUsername,
            months: selectedPlan.months,
            applied_promocode: appliedPromo?.code || null,
            ...(isPaymee && fragmentPlanPrice ? { slot_price: fragmentPlanPrice } : {}),
            ...(isPaymee && appliedPromo?.new_price != null
              ? { final_amount: appliedPromo.new_price }
              : {}),
          }
        : {
            username: profile.username,
            recipient: profile.recipient,
            months: selectedPlan.months,
            applied_promocode: appliedPromo?.code || null,
          };

      const res = await apiFetch(isCardFlow ? `${premiumApi}/order` : "/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });

      const data = await res.json();

      if (!res.ok) {
        // SLOTS_FULL xatosi
        if (data.code === "SLOTS_FULL") {
          setOrderIssue("busy");
          return;
        }
        if (data.code === "ALREADY_HAS_PREMIUM") {
          alert(data.error || t("ui.hasPremium"));
          return;
        }
        if (isPaymeeInsufficientError(data)) {
          setPaymeeStockModal(paymeeInsufficientAlertMessage(data, "premium"));
          return;
        }
        alert(data.error || t("ui.orderFail"));
        return;
      }

      const orderData = data.order || data;
      setOrder(orderData);
      paymentDoneClickedRef.current = false;
      setShowWarningModal(true);
      setPaymentStatus("payment_info");
      setCardLast4("");

      startCountdown(480); // 8 daqiqa
      startPolling(orderData.id);

    } catch {
      setOrderIssue("error");
    } finally {
      setLoadingBuy(false);
    }
  };

  // ================================
  // 📡 POLLING
  // ================================
  const startPolling = (id) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const pollUrl = isCardFlow
          ? `${premiumApi}/transactions/${id}`
          : `/api/premium/transactions/${id}`;
        const res = await apiFetch(pollUrl);
        const data = await res.json();

        if (!res.ok) return;

        let serverStatus = normalizePremiumPollStatus(data.status);

        setCardLast4(data.card_last4 || "");

        const holdPaymentInfoScreen =
          serverStatus === "pending" && !paymentDoneClickedRef.current;

        if (!holdPaymentInfoScreen) {
          setPaymentStatus(serverStatus);
        }

        // Natija ekranlari (muvaffaqiyat / jarayon / xato) — modal yopiq yoki warning ustida bo'lsa ham ko'rinsin
        const visibleResultStatuses = [
          "premium_sent",
          "payment_received",
          "processing",
          "failed",
          "error",
          "expired",
        ];
        if (visibleResultStatuses.includes(serverStatus)) {
          setShowWarningModal(false);
          setShowModal(true);
        }

        // To'lov / natija bosqichiga o'tilganda taymerni to'xtatish — aks holda vaqt tugaganda modal yopilib "expired" bo'ladi
        if (
          [
            "processing",
            "payment_received",
            "premium_sent",
            "failed",
            "error",
            "expired",
          ].includes(serverStatus)
        ) {
          stopCountdown();
        }

        // Premium yuborildi - muvaffaqiyatli
        if (serverStatus === "premium_sent") {
          stopPolling();
          // Auto-yopish timer
          setTimeout(() => setShowModal(false), 15000);
        }

        // Xatolik
        if (["failed", "error"].includes(serverStatus)) {
          stopPolling();
          setErrorMessage(data.error_message || data.reason || data.error || t("ui.unexpected"));
        }

        if (serverStatus === "expired") {
          stopPolling();
        }

      } catch {}
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  // ================================
  // ⏳ TIMER
  // ================================
  const startCountdown = (sec) => {
    stopCountdown();
    setCountdown(sec);

    countdownRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          stopCountdown();
          stopPolling();
          setShowWarningModal(false);
          setShowModal(true);
          setPaymentStatus("expired");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  // "To'lov qildim" tugmasi - payment_info dan pending ga o'tish
  const handlePaymentDone = () => {
    paymentDoneClickedRef.current = true;
    setPaymentStatus("pending");
  };

  // "Tushundim" tugmasi - warning modaldan payment modalga o'tish
  const handleWarningUnderstood = () => {
    setShowWarningModal(false);
    setShowModal(true);
  };

  // ================================
  // UI
  // ================================
  const recipientName = profile?.username || username.replace(/^@/, "").trim();
  const som = t("ui.som");
  const productName = order ? fill(t("ui.premiumMonths"), { n: order.muddat_oy }) : "";
  const planLabel = (p) => (p.months === 12 ? t("ui.year") : fill(t("ui.months"), { n: p.months }));
  const basePrice = isCardFlow ? fragmentPlanPrice : selectedPlan.price;
  const total = appliedPromo?.new_price ?? basePrice;
  const stage = STAGE_OF[paymentStatus];
  const closePayment = () => { setShowModal(false); stopPolling(); stopCountdown(); };
  const buyDisabled =
    loadingBuy ||
    loadingProfile ||
    Boolean(searchError) ||
    Boolean(paymeeStockMessage) ||
    (isCardFlow && (fragmentSlotsFull || fragmentPriceLoading)) ||
    !recipientName ||
    (!isCardFlow && !profile?.recipient);

  const planPrice = (p) => {
    if (!isCardFlow || selectedPlan.id !== p.id) return `${fmt(p.price)} ${som}`;
    if (fragmentPriceLoading) return "...";
    if (fragmentPlanPrice != null) return `${fmt(fragmentPlanPrice)} ${som}`;
    return fragmentSlotsFull ? t("ui.busyPrice") : "—";
  };

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--bar">
        <div className="pn-pagehero">
          <span className="pn-star-dust"><TgStar size={54} accent /><Dust /></span>
          <h1>Telegram Premium</h1>
          <ul><li>{t("ui.perk1")}</li><li>{t("ui.perk2")}</li><li>{t("ui.perk3")}</li></ul>
        </div>

        <RecipientField
          username={username}
          setUsername={setUsername}
          onMe={fillMyUsername}
          loading={loadingProfile}
          error={searchError}
          profile={profile}
        />

        <section className="pn-field">
          <label>{t("ui.plan")}</label>
          <div className="pn-plans">
            {plans.map((p) => (
              <button key={p.id} type="button" className={`pn-plan ${selectedPlan.id === p.id ? "is-active" : ""}`} onClick={() => setSelectedPlan(p)}>
                <i />
                <span className="pn-plan__text">
                  <b>{planLabel(p)}{PLAN_TAGS[p.months] && <em>{t(PLAN_TAGS[p.months])}</em>}</b>
                  <span>{fill(t("ui.perMonth"), { price: `${fmt(Math.round(p.price / p.months))} ${som}` })}</span>
                </span>
                <span className="pn-plan__price">{planPrice(p)}</span>
              </button>
            ))}
          </div>
        </section>

        {paymeeStockMessage && <PaymeeStockBanner product="premium" message={paymeeStockMessage} />}

        <PromoField code={pramacod} setCode={setPramacod} message={promoMessage} isError={promoError} applied={Boolean(appliedPromo)} onApply={handleCheckPromo} />

        <p className="pn-note">{t("ui.noRenew")}</p>
      </div>

      <div className="pn-bar">
        <span className="pn-bar__total"><small>{t("ui.total")}</small><b>{total != null ? `${fmt(total)} ${som}` : "—"}</b></span>
        <button type="button" className="pn-cta" disabled={buyDisabled} onClick={handleCreateOrder}>
          {loadingBuy ? t("common.loading") : t("ui.buy")}
        </button>
      </div>

      {paymeeStockModal && (
        <PaymeeStockAlert product="premium" message={paymeeStockModal} onClose={() => setPaymeeStockModal(null)} />
      )}

      {showWarningModal && order && (
        <Confirm product={productName} recipient={recipientName} amount={order.amount} onContinue={handleWarningUnderstood} />
      )}

      {showModal && order && paymentStatus === "payment_info" && (
        <Transfer amount={order.amount} item="premium" countdown={countdown} onClose={closePayment} onPaid={handlePaymentDone} />
      )}

      {showModal && order && stage && (
        <Status
          stage={stage}
          item="premium"
          product={productName}
          recipient={recipientName}
          amount={order.amount}
          countdown={countdown}
          orderId={order.id}
          errorText={errorMessage}
          note={stage === "received" && cardLast4 ? fill(t("ui.cardDetected"), { last4: cardLast4 }) : ""}
          onClose={closePayment}
          onDone={closePayment}
          onRetry={closePayment}
        />
      )}

      {orderIssue && (
        <Status
          sheet
          stage={orderIssue}
          item="premium"
          onClose={() => setOrderIssue(null)}
          onRetry={() => { setOrderIssue(null); handleCreateOrder(); }}
        />
      )}
    </Shell>
  );
}

export default function Premium() {
  return <PremiumPurchasePage variant="robynhood" />;
}
