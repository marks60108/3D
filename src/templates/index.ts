import type { Template } from "./types";
import { containerTemplate } from "./container";
import { bracketTemplate } from "./bracket";
import { tubeTemplate } from "./tube";
import { hookTemplate } from "./hook";
import { fanMountTemplate } from "./fanMount";
import { fanMountReinforcedTemplate } from "./fanMountReinforced";
import { dimmInstallerTemplate } from "./dimmInstaller";
import { deviceRiserTemplate } from "./deviceRiser";
import { charmPegPanelTemplate } from "./charmPegPanel";

export const templates: Template[] = [
  containerTemplate,
  bracketTemplate,
  tubeTemplate,
  hookTemplate,
  fanMountTemplate,
  fanMountReinforcedTemplate,
  dimmInstallerTemplate,
  deviceRiserTemplate,
  charmPegPanelTemplate,
];

export * from "./types";
