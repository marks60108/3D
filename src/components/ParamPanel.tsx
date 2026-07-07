import type { ParamDef, ParamValues } from "../templates/types";

interface ParamPanelProps {
  params: ParamDef[];
  values: ParamValues;
  onChange: (key: string, value: number | boolean) => void;
}

export function ParamPanel({ params, values, onChange }: ParamPanelProps) {
  return (
    <div className="param-panel">
      {params.map((p) => {
        if (p.kind === "boolean") {
          return (
            <label key={p.key} className="param-row param-row--checkbox">
              <input
                type="checkbox"
                checked={values[p.key] as boolean}
                onChange={(e) => onChange(p.key, e.target.checked)}
              />
              <span>{p.label}</span>
            </label>
          );
        }
        const value = values[p.key] as number;
        return (
          <label key={p.key} className="param-row">
            <span className="param-row__label">
              {p.label}
              {p.unit ? ` (${p.unit})` : ""}
            </span>
            <div className="param-row__controls">
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={value}
                onChange={(e) => onChange(p.key, Number(e.target.value))}
              />
              <input
                type="number"
                min={p.min}
                max={p.max}
                step={p.step}
                value={value}
                onChange={(e) => onChange(p.key, Number(e.target.value))}
              />
            </div>
          </label>
        );
      })}
    </div>
  );
}
