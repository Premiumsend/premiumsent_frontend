import { useEffect, useState } from "react";
import { INTROS } from "../../ui/Intro";
import "../../ui/pn.css";
import "./test.css";

// Faqat lokal ko'rik: intro variantlari telefon ramkalarida, avtomatik qayta o'ynaydi
const VARIANTS = [
  ["tracking", "1. Jipslashish", "Harflar kengdan markazga yig'iladi"],
  ["reveal", "2. Chiziq", "Yorug' chiziq yozuvni ochib o'tadi"],
  ["quiet", "3. Sokin", "Nom ko'tariladi, ostida shior"],
];

export default function Test() {
  const [run, setRun] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRun((n) => n + 1), 3600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pn-test" data-pn="cobalt">
      <header>
        <h1>Ochilish animatsiyasi</h1>
        <button type="button" onClick={() => setRun((n) => n + 1)}>Qayta ko'rish</button>
      </header>
      <div className="pn-test__grid">
        {VARIANTS.map(([id, title, note]) => {
          const Intro = INTROS[id];
          return (
            <figure key={id}>
              <figcaption><b>{title}</b>{note}</figcaption>
              <div className="pn-test__phone pn-root"><Intro key={run} /></div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
