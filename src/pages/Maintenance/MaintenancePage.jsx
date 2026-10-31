import React from "react";
import { useTranslation } from "../../context/LanguageContext";
import { Shell, openSupport } from "../../ui/Kit";
import { ToolIcon } from "../../ui/Brand";

export default function MaintenancePage() {
  const { t } = useTranslation();
  return (
    <Shell>
      <div className="pn-center">
        <span className="pn-center__ic"><ToolIcon size={30} /></span>
        <h1>{t("ui.mTitle")}</h1>
        <p>{t("ui.mText")}</p>
        <button type="button" className="pn-ghost" onClick={openSupport}>{t("ui.support")}</button>
      </div>
    </Shell>
  );
}
