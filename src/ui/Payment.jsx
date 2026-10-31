import { useEffect, useState } from "react";
import { CheckIcon, ClockIcon, CopyIcon, SendIcon, ShieldIcon, TgStar } from "./Brand";
import { fmt, openSupport } from "./Kit";

const TOTAL = 480;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Countdown({ left }) {
  const tone = left <= 60 ? "is-danger" : left <= 120 ? "is-warn" : "";
  return (
    <div className={`pn-timer ${tone}`}>
      <span><ClockIcon /> Qolgan vaqt</span>
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
  return (
    <div className="pn-pay__top">
      <button type="button" className="pn-modal__x" onClick={onClose} aria-label="Yopish">✕</button>
      <b>{title}</b>
      <span />
    </div>
  );
}

// Order ochilgandan keyin: summa aniq bo'lishi kerakligini tasdiqlatadi
export function Confirm({ product, recipient, amount, onContinue }) {
  return (
    <div className="pn-modal">
      <div className="pn-modal__panel pn-confirm" role="dialog" aria-modal="true">
        <span className="pn-confirm__ic"><ShieldIcon size={26} /></span>
        <h2>Xavfsiz to'lov</h2>
        <p className="pn-confirm__sub">{product}{recipient && <> → @{recipient}</>}</p>
        <div className="pn-confirm__box">
          Keyingi oynadagi kartaga aynan <b>{fmt(amount)} so'm</b> o'tkazing. Summa boshqacha bo'lsa, to'lov aniqlanmaydi.
        </div>
        <p className="pn-confirm__auto"><CheckIcon size={15} /> To'lov avtomatik tekshiriladi</p>
        <button type="button" className="pn-cta" onClick={onContinue}>Tushundim</button>
      </div>
    </div>
  );
}

const GUIDE = [
  ["Bank ilovasini oching", "Click, Payme, Uzum yoki boshqasi"],
  ["\"Kartaga o'tkazma\"ni tanlang", "Kartangizni kiritish shart emas"],
  ["Karta raqamini joylang", "Nusxa tugmasi bilan oling"],
  ["Summani aynan yozing", "Bir so'm farq ham bo'lmasin"],
  ["\"To'lov qildim\"ni bosing", "Qolganini tizim o'zi bajaradi"],
];

export function Transfer({ amount, item, countdown, onClose, onPaid }) {
  const cardNumber = String(import.meta.env.VITE_CARD_NUMBER || "").replace(/\s/g, "");
  const cardName = import.meta.env.VITE_CARD_NAME || "";
  const cardBrand = cardNumber.startsWith("9860") ? "HUMO" : "UZCARD";
  const [copied, copy] = useCopy();
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <div className="pn-pay">
      <PayTop title="To'lov" onClose={onClose} />
      <div className="pn-pay__body">
        <Countdown left={countdown} />
        <h2 className="pn-pay__title">Kartaga pul o'tkazing</h2>
        <p className="pn-pay__sub">Istalgan bank ilovasidan o'tkazing</p>

        <button type="button" className="pn-plastic" onClick={() => copy("card", cardNumber)}>
          <span className="pn-plastic__top"><span className="pn-plastic__chip" /><em>{cardBrand}</em></span>
          <span className="pn-plastic__num">{cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}</span>
          <span className="pn-plastic__foot">
            <span>{cardName}</span>
            <span className="pn-plastic__copy">{copied === "card" ? <><CheckIcon size={16} /> Nusxalandi</> : <><CopyIcon size={16} /> Nusxalash</>}</span>
          </span>
        </button>

        <button type="button" className="pn-amount" onClick={() => copy("amount", amount)}>
          <span><small>To'lov summasi</small><b>{fmt(amount)} so'm</b></span>
          <i>{copied === "amount" ? <CheckIcon /> : <CopyIcon />}</i>
        </button>

        <div className="pn-warn">
          <span>!</span>
          <p><b>Summani aynan shunday yozing</b>Aks holda {item === "stars" ? "Stars" : "Premium"} avtomatik yuborilmaydi.</p>
        </div>
        <button type="button" className="pn-help" onClick={() => setGuideOpen(true)}><i>?</i> Qanday to'lash kerak?</button>
      </div>

      <div className="pn-bar pn-bar--solo">
        <button type="button" className="pn-cta" onClick={onPaid}>To'lov qildim</button>
      </div>

      {guideOpen && (
        <div className="pn-modal">
          <div className="pn-modal__panel" role="dialog" aria-modal="true">
            <div className="pn-modal__head"><h2>To'lov qo'llanmasi</h2><button type="button" className="pn-modal__x" onClick={() => setGuideOpen(false)} aria-label="Yopish">✕</button></div>
            <ol className="pn-steps">
              {GUIDE.map(([title, sub], i) => <li key={title} className={i === 3 ? "is-key" : ""}><i>{i + 1}</i><span><b>{title}</b>{sub}</span></li>)}
            </ol>
          </div>
        </div>
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

const textFor = ({ product, recipient, amount, orderId, errorText }) => ({
  pending: { title: "To'lov tekshirilmoqda", text: `${fmt(amount)} so'm kelishini kutyapmiz`, note: "Oynani yopmang, to'lov avtomatik aniqlanadi." },
  received: { title: "To'lov qabul qilindi", text: recipient ? `${product} @${recipient} ga yuborilmoqda` : `${product} yuborilmoqda`, note: "Odatda bir necha daqiqa oladi." },
  success: { title: "Muvaffaqiyatli yuborildi", text: recipient ? `${product} @${recipient} hisobiga tushdi` : `${product} yuborildi`, note: "" },
  failed: { title: "Yuborishda xato bo'ldi", text: errorText || "Yuborishda muammo chiqdi", note: orderId ? `Buyurtma #${orderId} raqamini Yordam Markaziga yuboring.` : "" },
  expired: { title: "Vaqt tugadi", text: "8 daqiqa ichida to'lov aniqlanmadi", note: "Pul o'tkazgan bo'lsangiz, chekni Yordam Markaziga yuboring." },
  busy: { title: "Hozir band", text: "Hozirda juda ko'p buyurtmalar mavjud", note: "1-2 daqiqadan keyin qayta urinib ko'ring." },
  error: { title: "Buyurtma ochilmadi", text: "Aloqada xato bo'ldi", note: "Internetni tekshirib, qayta urinib ko'ring." },
});

/**
 * To'lovdan keyingi holatlar: pending, received, success, failed, expired,
 * hamda order ochilmagan holatlar: busy, error.
 */
export function Status({ stage, item, product, recipient, amount, countdown, orderId, txId, note, errorText, onClose, onDone, onRetry }) {
  const text = textFor({ product, recipient, amount, orderId, errorText })[stage];
  const noOrder = stage === "busy" || stage === "error";
  const support = <button type="button" className="pn-ghost" onClick={openSupport}>Yordam Markazi</button>;
  const close = <button type="button" className="pn-ghost" onClick={onClose}>Yopish</button>;
  const footer = {
    success: <button type="button" className="pn-cta" onClick={onDone || onClose}>Tayyor</button>,
    failed: <>{support}{close}</>,
    expired: <><button type="button" className="pn-cta" onClick={onRetry || onClose}>Qayta buyurtma</button>{support}</>,
    busy: <><button type="button" className="pn-cta" onClick={onRetry || onClose}>Qayta urinish</button>{close}</>,
    error: <><button type="button" className="pn-cta" onClick={onRetry || onClose}>Qayta urinish</button>{close}</>,
  }[stage] || close;

  return (
    <div className="pn-pay">
      <PayTop title="Buyurtma holati" onClose={onClose} />
      <div className="pn-pay__body pn-status">
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
            {orderId && <div><dt>Buyurtma</dt><dd>#{orderId}</dd></div>}
            <div><dt>Mahsulot</dt><dd>{product}</dd></div>
            {recipient && <div><dt>Qabul qiluvchi</dt><dd>@{recipient}</dd></div>}
            <div><dt>Summa</dt><dd>{fmt(amount)} so'm</dd></div>
            {txId && <div><dt>Tranzaksiya</dt><dd className="pn-receipt__tx">{txId}</dd></div>}
          </dl>
        )}
        {(note || text.note) && <p className="pn-status__note">{note || text.note}</p>}
      </div>
      <div className="pn-bar pn-bar--solo pn-bar--stack">{footer}</div>
    </div>
  );
}
