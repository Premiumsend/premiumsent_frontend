import React from "react";
import { Shell, openSupport } from "../../ui/Kit";
import { ToolIcon } from "../../ui/Brand";

export default function MaintenancePage() {
  return (
    <Shell>
      <div className="pn-center">
        <span className="pn-center__ic"><ToolIcon size={30} /></span>
        <h1>Texnik ishlar</h1>
        <p>Ilovani yaxshilayapmiz. Tez orada qaytamiz.</p>
        <button type="button" className="pn-ghost" onClick={openSupport}>Yordam Markazi</button>
      </div>
    </Shell>
  );
}
