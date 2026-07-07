import type { Template } from "./types";
import { containerTemplate } from "./container";
import { bracketTemplate } from "./bracket";
import { tubeTemplate } from "./tube";
import { hookTemplate } from "./hook";
import { fanMountTemplate } from "./fanMount";
import { dimmInstallerTemplate } from "./dimmInstaller";

export const templates: Template[] = [
  containerTemplate,
  bracketTemplate,
  tubeTemplate,
  hookTemplate,
  fanMountTemplate,
  dimmInstallerTemplate,
];

export * from "./types";
