import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "../../context/LanguageContext";
import apiFetch from "../../utils/apiFetch";
import { Modal, Shell, Tabs, fill, fmt } from "../../ui/Kit";
import { TgStar } from "../../ui/Brand";

// Bonus: har xarid uchun ⭐ yig'iladi, balansdan Stars qilib o'ziga yoki istalgan username'ga yuboriladi.
// Qoidalar va limitlar backend'dan (/api/rewards/status) keladi.
const POLL_MS = 4000;
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const PREMIUM_PLANS = [3, 6, 12];

const formatDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function RedeemModal({ balance, min, max, tr, username, onClose, onDone }) {
  const limit = Math.min(balance, max);
  const [amount, setAmount] = useState(String(min));
  const [mode, setMode] = useState(username ? "self" : "other");
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const value = Number(amount);
  const validAmount = Number.isInteger(value) && value >= min && value <= limit;
  const clean = other.trim().replace(/^@/, "");
  const validRecipient = mode === "self" ? Boolean(username) : USERNAME_RE.test(clean);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, recipient_username: mode === "other" ? clean : undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const key = `err_${body.code}`;
        throw new Error(tr(key) === `ui.bonus.${key}` ? tr("err_generic") : tr(key));
      }
      onDone();
    } catch (err) {
      setError(err.message || tr("err_generic"));
      setBusy(false);
    }
  };

  return (
    <Modal title={tr("useTitle")} onClose={onClose}>
      <div className="pn-withdraw__info"><span>{tr("available")}</span><b>{fmt(balance)} ⭐</b></div>

      <div className="pn-field">
        <label htmlFor="pn-bonus-amount">{tr("amountLabel")}</label>
        <div className="pn-input">
          <input
            id="pn-bonus-amount"
            type="number"
            inputMode="numeric"
            min={min}
            max={limit}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="pn-filters pn-bonus__chips">
          {[min, 100].filter((n) => n <= limit).map((n) => (
            <button key={n} type="button" className={value === n ? "is-active" : ""} onClick={() => setAmount(String(n))}>{n}</button>
          ))}
          <button type="button" className={value === limit ? "is-active" : ""} onClick={() => setAmount(String(limit))}>{tr("all")}</button>
        </div>
        {amount !== "" && !validAmount && <p className="pn-error">{fill(tr("amountHint"), { min, max: limit })}</p>}
      </div>

      <div className="pn-field">
        <label>{tr("recipientLabel")}</label>
        <div className="pn-filters pn-bonus__chips">
          <button type="button" className={mode === "self" ? "is-active" : ""} disabled={!username} onClick={() => setMode("self")}>
            {username ? `${tr("self")} · @${username}` : tr("self")}
          </button>
          <button type="button" className={mode === "other" ? "is-active" : ""} onClick={() => setMode("other")}>{tr("other")}</button>
        </div>
        {mode === "other" && (
          <div className="pn-input">
            <span>@</span>
            <input
              value={other}
              onChange={(e) => setOther(e.target.value.replace(/\s/g, ""))}
              placeholder="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              maxLength={33}
            />
          </div>
        )}
      </div>

      {error && <p className="pn-error">{error}</p>}
      <button type="button" className="pn-cta pn-cta--full" disabled={!validAmount || !validRecipient || busy} onClick={submit}>
        {busy ? tr("sending") : validAmount ? fill(tr("confirmCta"), { n: fmt(value) }) : tr("useBtn")}
      </button>
    </Modal>
  );
}

export default function Bonus() {
  const { t } = useTranslation();
  const tr = useCallback((key) => t(`ui.bonus.${key}`), [t]);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const pollRef = useRef(null);
  const username = String(window?.Telegram?.WebApp?.initDataUnsafe?.user?.username || "");

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/rewards/status");
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Yechish yuborilayotganda holat yangilanib turadi
  useEffect(() => {
    clearInterval(pollRef.current);
    if (data?.active_redemption) pollRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [data?.active_redemption, load]);

  const entryLabel = (e) => {
    const m = e.meta || {};
    if (e.kind === "purchase") {
      return fill(tr(String(m.order_type || "").includes("premium") ? "srcPremium" : "srcStars"), { n: m.type_amount });
    }
    if (e.kind === "redeem") return tr("srcRedeem");
    if (e.kind === "refund") return tr("srcRefund");
    return tr("srcAdmin");
  };

  let body;
  if (failed && !data) {
    body = <div className="pn-empty"><b>{tr("loadError")}</b></div>;
  } else if (!data) {
    body = <div className="pn-empty"><div className="pn-spin" /></div>;
  } else {
    const { balance, min_redeem: minRedeem, max_redeem: maxRedeem, ledger, rules = {}, active_redemption: active } = data;
    const canRedeem = balance >= minRedeem && !active;
    body = (
      <>
        <div className="pn-balance">
          <div><small>{tr("balance")}</small><strong><TgStar size={30} /> {fmt(balance)}</strong></div>
          <button type="button" className="pn-cta pn-cta--sm" disabled={!canRedeem} onClick={() => setRedeeming(true)}>{tr("useBtn")}</button>
          <p>
            <span>{fill(tr("toMin"), { n: minRedeem })}</span>
            <b>{balance < minRedeem ? fill(tr("need"), { n: fmt(minRedeem - balance) }) : tr("ready")}</b>
          </p>
        </div>

        {active && <p className="pn-hint">{tr("inProgress")}</p>}

        <h2 className="pn-h2">{tr("howTitle")}</h2>
        <ul className="pn-rules">
          <li><i>⭐</i><span>{tr("ruleStars")}</span><b>+{rules.stars_per_50}</b></li>
          {PREMIUM_PLANS.map((n) => (
            <li key={n}><i>👑</i><span>{fill(tr("rulePremium"), { n })}</span><b>+{n * (rules.premium_per_month || 0)}</b></li>
          ))}
        </ul>
        <p className="pn-hint">{tr("ruleNote")}</p>

        <h2 className="pn-h2">{tr("historyTitle")}</h2>
        {ledger.length === 0 ? (
          <p className="pn-hint">{tr("empty")}</p>
        ) : (
          <ul className="pn-orders">
            {ledger.map((e) => (
              <li key={e.id}>
                <span className="pn-order__ic is-gold"><TgStar size={22} /></span>
                <span className="pn-order__main"><b>{entryLabel(e)}</b>{formatDate(e.created_at)}</span>
                <span className="pn-order__side"><b className={e.delta > 0 ? "pn-bonus__plus" : ""}>{e.delta > 0 ? `+${fmt(e.delta)}` : `−${fmt(Math.abs(e.delta))}`} ⭐</b></span>
              </li>
            ))}
          </ul>
        )}

        {redeeming && (
          <RedeemModal
            balance={balance}
            min={minRedeem}
            max={maxRedeem}
            tr={tr}
            username={username}
            onClose={() => setRedeeming(false)}
            onDone={() => { setRedeeming(false); load(); }}
          />
        )}
      </>
    );
  }

  return (
    <Shell>
      <div className="pn-scroll pn-scroll--tabs">
        <h1 className="pn-title">{tr("title")}</h1>
        {body}
      </div>
      <Tabs active="bonus" />
    </Shell>
  );
}
