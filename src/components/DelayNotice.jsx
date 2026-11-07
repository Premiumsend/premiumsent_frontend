import { useTranslation } from "../context/LanguageContext";
import { ClockIcon } from "../ui/Brand";
import useDelayNotice from "../utils/useDelayNotice";
import "./DelayNotice.css";

/**
 * "Buyurtmalar 12 soatgacha kechikishi mumkin" — admin switchi yoqilganda.
 * @param {'inline'|'compact'} variant
 *   inline  — xarid sahifasi (Stars/Premium), hero ostida
 *   compact — to'lovni tasdiqlash oynasi (Confirm) ichida
 */
export default function DelayNotice({ variant = "inline", className = "" }) {
  const { t } = useTranslation();
  const on = useDelayNotice();
  if (!on) return null;

  const compact = variant === "compact";
  return (
    <div className={`pn-delay pn-delay--${variant} ${className}`.trim()} role="status">
      <span className="pn-delay__ic"><ClockIcon size={compact ? 16 : 20} /></span>
      <span className="pn-delay__text">
        {!compact && <b>{t("ui.delayTitle")}</b>}
        <span>{compact ? t("ui.delayShort") : t("ui.delayText")}</span>
      </span>
    </div>
  );
}
