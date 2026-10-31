import "./intro.css";

const WORD = "Premiumsend";
const ACCENT_FROM = 7;

// 1: harflar kengdan markazga jipslashadi
function Tracking() {
  const middle = (WORD.length - 1) / 2;
  return (
    <div className="pi">
      <span className="pi-word" aria-label={WORD}>
        {[...WORD].map((c, i) => (
          <span key={i} className={`pi-track ${i >= ACCENT_FROM ? "is-accent" : ""}`} style={{ "--x": `${(i - middle) * 15}px` }}>{c}</span>
        ))}
      </span>
    </div>
  );
}

// 2: yorug' chiziq chapdan o'ngga o'tib, yozuvni ochadi
function Reveal() {
  return (
    <div className="pi">
      <span className="pi-reveal">
        <span className="pi-word pi-clip">Premium<span className="is-accent">send</span></span>
        <i className="pi-beam" />
      </span>
    </div>
  );
}

// 3: nom sokin ko'tariladi, "send" rangga kiradi, ostida shior
function Quiet() {
  return (
    <div className="pi">
      <span className="pi-word pi-quiet">Premium<span className="pi-tint">send</span></span>
      <span className="pi-tag">Telegram Premium va Stars</span>
    </div>
  );
}

export const INTROS = { tracking: Tracking, reveal: Reveal, quiet: Quiet };
