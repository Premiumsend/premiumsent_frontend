import React from "react";
import { useNavigate } from "react-router-dom";
import "./Legal.css";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="legal-page">
      <header className="legal-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Privacy Policy</h1>
      </header>
      <div className="legal-content">
        <section>
          <h2>1. Ma'lumotlar yig'ish</h2>
          <p>Biz faqat xizmat ko'rsatish uchun zarur bo'lgan ma'lumotlarni yig'amiz.</p>
        </section>
        <section>
          <h2>2. Ma'lumotlardan foydalanish</h2>
          <p>Sizning ma'lumotlaringiz faqat buyurtmalarni qayta ishlash uchun ishlatiladi.</p>
        </section>
        <section>
          <h2>3. Ma'lumotlar xavfsizligi</h2>
          <p>Biz sizning ma'lumotlaringizni himoya qilish uchun barcha zarur choralarni ko'ramiz.</p>
        </section>
      </div>
    </div>
  );
}
