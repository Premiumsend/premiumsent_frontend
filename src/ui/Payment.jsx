import { useState } from "react";
import { CheckIcon, ClockIcon, CopyIcon, SendIcon, ShieldIcon, TgStar } from "./Brand";
import { useTranslation } from "../context/LanguageContext";
import { Modal, fill, fmt, openSupport, useClosing } from "./Kit";
import { usePaymentCard } from "../utils/paymentCard";

const TOTAL = 480;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Countdown({ left }) {
  const { t } = useTranslation();
  const tone = left <= 60 ? "is-danger" : left <= 120 ? "is-warn" : "";
  return (
    <div className={`pn-timer ${tone}`}>
      <span><ClockIcon /> {t("ui.timeLeft")}</span>
      <b>{mmss(left)}</b>
      <i style={{ transform: `scaleX(${Math.max(0, left) / TOTAL})` }} />
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState("");
  return [copied, (key, value) => {
    navigator.clipboard?.writeText(String(value)).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }];
}

function PayTop({ title, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="pn-pay__top">
      <button type="button" className="pn-modal__x" onClick={onClose} aria-label={t("ui.close")}>✕</button>
      <b>{title}</b>
      <span />
    </div>
  );
}

// Order ochilgandan keyin: summa aniq bo'lishi kerakligini tasdiqlatadi
export function Confirm({ product, recipient, amount, onContinue }) {
  const { t } = useTranslation();
  const [closing, proceed] = useClosing(onContinue);
  return (
    <div className={`pn-modal ${closing ? "is-closing" : ""}`}>
      <div className="pn-modal__panel pn-confirm" role="dialog" aria-modal="true">
        <span className="pn-confirm__ic"><ShieldIcon size={26} /></span>
        <h2>{t("ui.safeTitle")}</h2>
        <p className="pn-confirm__sub">{product}{recipient && <> → @{recipient}</>}</p>
        <div className="pn-confirm__box">
          {t("ui.confirmPre")} <b>{fmt(amount)} {t("ui.som")}</b> {t("ui.confirmPost")}
        </div>
        <p className="pn-confirm__auto"><CheckIcon size={15} /> {t("ui.autoCheck")}</p>
        <button type="button" className="pn-cta" onClick={proceed}>{t("ui.understood")}</button>
      </div>
    </div>
  );
}

export function Transfer({ amount, item, countdown, onClose, onPaid }) {
  const { cardNumber, cardNumberDisplay, cardNameDisplay, providerLabel, ready } = usePaymentCard();
  const cardBrand = providerLabel || "UZCARD";
  const [copied, copy] = useCopy();
  const [guideOpen, setGuideOpen] = useState(false);
  const [closing, close] = useClosing(onClose, 240);
  const { t } = useTranslation();
  return (
    <div className={`pn-pay pn-pay--sheet ${closing ? "is-closing" : ""}`}>
      <PayTop title={t("ui.payTitle")} onClose={close} />
      <div className="pn-pay__body">
        <Countdown left={countdown} />
        <h2 className="pn-pay__title">{t("ui.transferTitle")}</h2>
        <p className="pn-pay__sub">{t("ui.transferSub")}</p>

        <button type="button" className="pn-plastic" disabled={!ready} onClick={() => copy("card", cardNumber)}>
          <span className="pn-plastic__top"><span className="pn-plastic__chip" /><em>{cardBrand}</em></span>
          <span className="pn-plastic__num">{ready ? cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : cardNumberDisplay}</span>
          <span className="pn-plastic__foot">
            <span>{cardNameDisplay}</span>
            <span className="pn-plastic__copy">{copied === "card" ? <><CheckIcon size={16} /> {t("ui.copied")}</> : <><CopyIcon size={16} /> {t("ui.copy")}</>}</span>
          </span>
        </button>

        <button type="button" className="pn-amount" onClick={() => copy("amount", amount)}>
          <span><small>{t("ui.payAmount")}</small><b>{fmt(amount)} {t("ui.som")}</b></span>
          <i>{copied === "amount" ? <CheckIcon /> : <CopyIcon />}</i>
        </button>

        <div className="pn-warn">
          <span>!</span>
          <p><b>{t("ui.exactTitle")}</b>{fill(t("ui.exactDesc"), { item: item === "stars" ? "Stars" : "Premium" })}</p>
        </div>
        <button type="button" className="pn-help" onClick={() => setGuideOpen(true)}><i>?</i> {t("ui.howPay")}</button>
      </div>

      <div className="pn-bar pn-bar--solo">
        <button type="button" className="pn-cta" onClick={onPaid}>{t("ui.paid")}</button>
      </div>

      {guideOpen && (
        <Modal title={t("ui.payGuide")} onClose={() => setGuideOpen(false)}>
          <ol className="pn-steps">
            {[1, 2, 3, 4, 5].map((n) => <li key={n} className={n === 4 ? "is-key" : ""}><i>{n}</i><span><b>{t(`ui.p${n}`)}</b>{t(`ui.p${n}d`)}</span></li>)}
          </ol>
        </Modal>
      )}
    </div>
  );
}

const BURST = [
  [12, 74, 19], [64, 98, 16], [118, 70, 18], [171, 106, 15], [226, 80, 20], [283, 94, 17], [333, 68, 16],
  [38, 124, 15], [92, 136, 18], [147, 118, 16], [198, 140, 14], [249, 122, 17], [304, 132, 15], [356, 114, 18],
];

function Hero({ stage, item }) {
  const accent = item !== "stars";
  if (stage === "success") {
    return (
      <div className="pn-hero is-success">
        {BURST.map(([a, r, s], i) => (
          <span key={a} className="pn-burst" style={{ "--a": `${a}deg`, "--r": `${r}px`, "--d": `${240 + i * 42}ms` }}><TgStar size={s} accent={accent} /></span>
        ))}
        <CheckIcon size={46} />
      </div>
    );
  }
  if (["failed", "busy", "error"].includes(stage)) {
    return <div className={`pn-hero is-warn ${stage !== "busy" ? "is-error" : ""}`}><span className="pn-ping" /><span className="pn-ping pn-ping--late" /><b>!</b></div>;
  }
  if (stage === "expired") return <div className="pn-hero is-expired"><ClockIcon size={46} /></div>;
  return (
    <div className={`pn-hero is-${stage}`}>
      {stage === "pending" && <span className="pn-ring" />}
      {stage === "received" && <><span className="pn-ping" /><span className="pn-ping pn-ping--late" /></>}
      <TgStar size={46} accent={accent} />
    </div>
  );
}

const textFor = (t, { product, recipient, amount, orderId, errorText }) => {
  const vars = { product, user: recipient, amount: `${fmt(amount)} ${t("ui.som")}`, id: orderId };
  const line = (key) => fill(t(`ui.${key}`), vars);
  return {
    pending: { title: line("pendingT"), text: line("pendingD"), note: line("pendingN") },
    received: { title: line("receivedT"), text: line(recipient ? "receivedD" : "receivedD2"), note: line("receivedN") },
    success: { title: line("successT"), text: line(recipient ? "successD" : "successD2"), note: "" },
    failed: { title: line("failedT"), text: errorText || line("failedD"), note: orderId ? line("failedN") : "" },
    expired: { title: line("expiredT"), text: line("expiredD"), note: line("expiredN") },
    busy: { title: line("busyT"), text: line("busyD"), note: line("busyN") },
    error: { title: line("errorT"), text: line("errorD"), note: line("errorN") },
  };
};

/**
 * To'lovdan keyingi holatlar: pending, received, success, failed, expired,
 * hamda order ochilmagan holatlar: busy, error.
 */
export function Status({ stage, item, product, recipient, amount, countdown, orderId, txId, note, errorText, sheet = false, onClose, onDone, onRetry }) {
  const { t } = useTranslation();
  const text = textFor(t, { product, recipient, amount, orderId, errorText })[stage];
  const noOrder = stage === "busy" || stage === "error";
  const [closing, closeSheet] = useClosing(onClose, 240);
  const support = <button type="button" className="pn-ghost" onClick={openSupport}>{t("ui.support")}</button>;
  const close = <button type="button" className="pn-ghost" onClick={closeSheet}>{t("ui.close")}</button>;
  const footer = {
    success: <button type="button" className="pn-cta" onClick={onDone || closeSheet}>{t("ui.done")}</button>,
    failed: <>{support}{close}</>,
    expired: <><button type="button" className="pn-cta" onClick={onRetry || closeSheet}>{t("ui.reorder")}</button>{support}</>,
    busy: <><button type="button" className="pn-cta" onClick={onRetry || closeSheet}>{t("ui.retry")}</button>{close}</>,
    error: <><button type="button" className="pn-cta" onClick={onRetry || closeSheet}>{t("ui.retry")}</button>{close}</>,
  }[stage] || close;

  return (
    <div className={`pn-pay ${sheet ? "pn-pay--sheet" : ""} ${closing ? "is-closing" : ""}`}>
      <PayTop title={t("ui.statusTitle")} onClose={closeSheet} />
      <div className="pn-pay__body pn-status" key={stage}>
        <div className="pn-status__timer">{(stage === "pending" || stage === "expired") && <Countdown left={stage === "expired" ? 0 : countdown} />}</div>
        <Hero key={stage} stage={stage} item={item} />
        <h2>{text.title}</h2>
        <p className="pn-status__text">
          {stage === "pending" && <span className="pn-mini-spin" />}
          {stage === "received" && <span className="pn-send"><SendIcon /></span>}
          {text.text}
        </p>
        {!noOrder && (
          <dl className="pn-receipt">
            {orderId && <div><dt>{t("ui.rOrder")}</dt><dd>#{orderId}</dd></div>}
            <div><dt>{t("ui.rProduct")}</dt><dd>{product}</dd></div>
            {recipient && <div><dt>{t("ui.rRecipient")}</dt><dd>@{recipient}</dd></div>}
            <div><dt>{t("ui.rAmount")}</dt><dd>{fmt(amount)} {t("ui.som")}</dd></div>
            {txId && <div><dt>{t("ui.rTx")}</dt><dd className="pn-receipt__tx">{txId}</dd></div>}
          </dl>
        )}
        {(note || text.note) && <p className="pn-status__note">{note || text.note}</p>}
      </div>
      <div className="pn-bar pn-bar--solo pn-bar--stack">{footer}</div>
    </div>
  );
}
