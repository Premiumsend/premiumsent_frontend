import React from "react";
import { useNavigate } from "react-router-dom";
import "./Legal.css";

export default function TermsOfService() {
  const navigate = useNavigate();
  
  return (
    <div className="legal-page">
      <header className="legal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Terms of Service</h1>
      </header>
      <div className="legal-content">
        <section>
          <h2>1. Xizmat shartlari</h2>
          <p>Premium Send xizmatidan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.</p>
        </section>
        <section>
          <h2>2. Xizmatlar</h2>
          <p>Biz Telegram Premium obunalarini sotib olish imkoniyatini taqdim etamiz.</p>
        </section>
        <section>
          <h2>3. To'lovlar</h2>
          <p>Barcha to'lovlar qaytarilmaydi. To'lov qilishdan oldin ma'lumotlaringizni tekshiring.</p>
        </section>
      </div>
    </div>
  );
}
