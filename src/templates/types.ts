import type { Manifold, ManifoldToplevel } from "manifold-3d";

/** Optional grouping for the parameter panel. Omitted params fall back to an
 * auto-assigned group (offset/微調 params collapse into a "微調" group). */
export type ParamGroup = string;

export interface NumberParamDef {
  kind: "number";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
  group?: ParamGroup;
}

export interface BooleanParamDef {
  kind: "boolean";
  key: string;
  label: string;
  default: boolean;
  group?: ParamGroup;
}

export interface SelectParamDef {
  kind: "select";
  key: string;
  label: string;
  options: { label: string; value: number }[];
  default: number;
  group?: ParamGroup;
}

export type ParamDef = NumberParamDef | BooleanParamDef | SelectParamDef;

export type ParamValues = Record<string, number | boolean>;

export type TemplateCategory =
  | "server"
  | "storage-display"
  | "generic";

export interface Template {
  id: string;
  name: string;
  description: string;
  category?: TemplateCategory;
  params: ParamDef[];
  build: (values: ParamValues, M: ManifoldToplevel) => Manifold;
}

export function defaultValues(params: ParamDef[]): ParamValues {
  const values: ParamValues = {};
  for (const p of params) values[p.key] = p.default;
  return values;
}

export const ADJUST_GROUP = "微調(可選)";
export const BASIC_GROUP = "基本尺寸";

/** Resolve which group a param belongs to: explicit `group`, else auto —
 * offset / 微調 params go to the collapsible ADJUST_GROUP, the rest to
 * BASIC_GROUP. */
export function resolveGroup(param: ParamDef): ParamGroup {
  if (param.group) return param.group;
  if (/Offset[XY]?$/.test(param.key) || param.label.includes("微調")) {
    return ADJUST_GROUP;
  }
  return BASIC_GROUP;
}

/** Groups that should start collapsed in the panel. */
export function groupDefaultCollapsed(group: ParamGroup): boolean {
  return group === ADJUST_GROUP || group.includes("進階");
}

export function num(values: ParamValues, key: string): number {
  return values[key] as number;
}

export function bool(values: ParamValues, key: string): boolean {
  return values[key] as boolean;
}
