import type { Manifold, ManifoldToplevel } from "manifold-3d";

export interface NumberParamDef {
  kind: "number";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

export interface BooleanParamDef {
  kind: "boolean";
  key: string;
  label: string;
  default: boolean;
}

export type ParamDef = NumberParamDef | BooleanParamDef;

export type ParamValues = Record<string, number | boolean>;

export interface Template {
  id: string;
  name: string;
  description: string;
  params: ParamDef[];
  build: (values: ParamValues, M: ManifoldToplevel) => Manifold;
}

export function defaultValues(params: ParamDef[]): ParamValues {
  const values: ParamValues = {};
  for (const p of params) values[p.key] = p.default;
  return values;
}

export function num(values: ParamValues, key: string): number {
  return values[key] as number;
}

export function bool(values: ParamValues, key: string): boolean {
  return values[key] as boolean;
}
