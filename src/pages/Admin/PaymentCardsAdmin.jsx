import { useCallback, useEffect, useState } from "react";
import apiFetch from "../../utils/apiFetch";

// Mijozga ko'rsatiladigan to'lov kartasi. Almashtirish darhol ishlaydi, qayta build kerak emas
export default function PaymentCardsAdmin() {
  const [cards, setCards] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/payment-cards");
      const data = await res.json();
      if (res.ok) setCards(data.cards || []);
    } catch (err) {
      console.error("Kartalarni yuklashda xato:", err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const choose = async (card) => {
    if (card.active || !card.configured || busy) return;
    if (!window.confirm(`${card.label} ${card.display} ga almashtirilsinmi?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/payment-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: card.slot }),
      });
      const data = await res.json();
      if (res.ok) setCards(data.cards || []);
      else setError(data.error || "Xatolik");
    } catch {
      setError("Xatolik");
    }
    setBusy(false);
  };

  return (
    <>
      <h3 className="settings-section-title">💳 To'lov kartasi</h3>
      <p className="settings-section-desc">
        Mijozga to'lov ekranida qaysi karta ko'rsatiladi. Ikkala kartaga kelgan to'lov ham avtomatik yopiladi. Limit tugasa karta o'zi almashadi.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 20 }}>
        {cards.length === 0 && <p className="settings-section-desc">Kartalar yuklanmoqda…</p>}
        {cards.map((c) => (
          <button
            key={c.slot}
            type="button"
            disabled={c.active || !c.configured || busy}
            onClick={() => choose(c)}
            style={{
              padding: 14, borderRadius: 14, textAlign: "left", color: "#fff", cursor: c.active || !c.configured ? "default" : "pointer",
              background: c.active ? "rgba(20,184,166,.18)" : "rgba(255,255,255,.05)",
              border: `1.5px solid ${c.active ? "#14b8a6" : "rgba(255,255,255,.12)"}`,
              opacity: c.configured ? 1 : 0.5,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
              <span>{c.label}</span>
              {c.active && <span style={{ color: "#14b8a6" }}>FAOL</span>}
              {!c.configured && <span>SOZLANMAGAN</span>}
            </div>
            <div style={{ margin: "8px 0 4px", fontSize: 16, fontWeight: 650, letterSpacing: ".02em" }}>{c.display || "—— —— —— ——"}</div>
            <div style={{ fontSize: 13, opacity: .7 }}>{c.name || "—"}</div>
          </button>
        ))}
      </div>
      {error && <p style={{ color: "#ff6b61" }}>{error}</p>}
    </>
  );
}
