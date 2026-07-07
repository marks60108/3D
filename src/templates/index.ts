import type { Template } from "./types";
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
import { charmPegPanelTemplate } from "./charmPegPanel";

export const templates: Template[] = [
  containerTemplate,
  bracketTemplate,
  tubeTemplate,
  hookTemplate,
  fanMountTemplate,
  fanMountReinforcedTemplate,
  fanMountFrameTemplate,
  fanMountLegTemplate,
  dimmInstallerTemplate,
  deviceRiserTemplate,
  charmPegPanelTemplate,
];

export * from "./types";
