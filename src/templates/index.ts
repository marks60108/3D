import type { Template, TemplateCategory } from "./types";
import { containerTemplate } from "./container";
import { bracketTemplate } from "./bracket";
import { tubeTemplate } from "./tube";
import { hookTemplate } from "./hook";
import { fanMountTemplate } from "./fanMount";
import { fanMountReinforcedTemplate } from "./fanMountReinforced";
import { fanMountFrameTemplate } from "./fanMountFrame";
import { fanMountLegTemplate } from "./fanMountLeg";
import { dimmInstallerTemplate } from "./dimmInstaller";
import { deviceRiserTemplate } from "./deviceRiser";
import { deviceTrayTemplate } from "./deviceTray";
import { charmPegPanelTemplate } from "./charmPegPanel";
import { dollHighChairTemplate, dollSwingTemplate } from "./dollChairs";

/** Category assigned per template id (kept here so template files stay focused
 * on geometry). */
const CATEGORY_BY_ID: Record<string, TemplateCategory> = {
  "fan-mount": "server",
  "fan-mount-reinforced": "server",
  "fan-mount-frame": "server",
  "fan-mount-leg": "server",
  "dimm-installer": "server",
  "device-riser": "server",
  "device-tray": "server",
  container: "storage-display",
  "charm-peg-panel": "storage-display",
  "doll-high-chair": "storage-display",
  "doll-swing": "storage-display",
  hook: "storage-display",
  bracket: "generic",
  tube: "generic",
};

export const templates: Template[] = [
  fanMountTemplate,
  fanMountReinforcedTemplate,
  fanMountFrameTemplate,
  fanMountLegTemplate,
  dimmInstallerTemplate,
  deviceRiserTemplate,
  deviceTrayTemplate,
  containerTemplate,
  charmPegPanelTemplate,
  dollHighChairTemplate,
  dollSwingTemplate,
  hookTemplate,
  bracketTemplate,
  tubeTemplate,
].map((t) => ({ ...t, category: t.category ?? CATEGORY_BY_ID[t.id] ?? "generic" }));

export const CATEGORY_ORDER: TemplateCategory[] = [
  "server",
  "storage-display",
  "generic",
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  server: "伺服器 / 機殼散熱",
  "storage-display": "收納 / 展示",
  generic: "通用幾何",
};

/** Templates grouped by category in display order (empty categories omitted). */
export function templatesByCategory(): {
  category: TemplateCategory;
  label: string;
  items: Template[];
}[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: templates.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);
}

export * from "./types";
