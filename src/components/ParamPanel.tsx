import { useMemo, useState } from "react";
import type { ParamDef, ParamValues, ParamGroup } from "../templates/types";
import { resolveGroup, groupDefaultCollapsed } from "../templates/types";

interface ParamPanelProps {
  params: ParamDef[];
  values: ParamValues;
  onChange: (key: string, value: number | boolean) => void;
}

function ParamRow({
  param,
  values,
  onChange,
}: {
  param: ParamDef;
  values: ParamValues;
  onChange: (key: string, value: number | boolean) => void;
}) {
  if (param.kind === "boolean") {
    return (
      <label className="param-row param-row--checkbox">
        <input
          type="checkbox"
          checked={values[param.key] as boolean}
          onChange={(e) => onChange(param.key, e.target.checked)}
        />
        <span>{param.label}</span>
      </label>
    );
  }
  const value = values[param.key] as number;
  return (
    <label className="param-row">
      <span className="param-row__label">
        {param.label}
        {param.unit ? ` (${param.unit})` : ""}
      </span>
      <div className="param-row__controls">
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={value}
          onChange={(e) => onChange(param.key, Number(e.target.value))}
        />
        <input
          type="number"
          min={param.min}
          max={param.max}
          step={param.step}
          value={value}
          onChange={(e) => onChange(param.key, Number(e.target.value))}
        />
      </div>
    </label>
  );
}

export function ParamPanel({ params, values, onChange }: ParamPanelProps) {
  const groups = useMemo(() => {
    const order: ParamGroup[] = [];
    const byGroup = new Map<ParamGroup, ParamDef[]>();
    for (const p of params) {
      const g = resolveGroup(p);
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(p);
    }
    return order.map((g) => ({ name: g, params: byGroup.get(g)! }));
  }, [params]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // A single implicit group (everything basic) needs no header/chrome.
  if (groups.length === 1) {
    return (
      <div className="param-panel">
        {groups[0].params.map((p) => (
          <ParamRow key={p.key} param={p} values={values} onChange={onChange} />
        ))}
      </div>
    );
  }

  return (
    <div className="param-panel">
      {groups.map((group) => {
        const isCollapsed = collapsed[group.name] ?? groupDefaultCollapsed(group.name);
        return (
          <div key={group.name} className="param-group">
            <button
              type="button"
              className="param-group__header"
              aria-expanded={!isCollapsed}
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [group.name]: !isCollapsed }))
              }
            >
              <span className={`param-group__chevron ${isCollapsed ? "" : "open"}`}>
                ▶
              </span>
              <span>{group.name}</span>
              <span className="param-group__count">{group.params.length}</span>
            </button>
            {!isCollapsed && (
              <div className="param-group__body">
                {group.params.map((p) => (
                  <ParamRow key={p.key} param={p} values={values} onChange={onChange} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
