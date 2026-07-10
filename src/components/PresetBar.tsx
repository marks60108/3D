import { useEffect, useState } from "react";
import type { ParamValues } from "../templates/types";
import {
  listPresetNames,
  savePreset,
  loadPreset,
  deletePreset,
} from "../lib/presets";

interface PresetBarProps {
  templateId: string;
  values: ParamValues;
  onLoad: (values: ParamValues) => void;
}

export function PresetBar({ templateId, values, onLoad }: PresetBarProps) {
  const [names, setNames] = useState<string[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    setNames(listPresetNames(templateId));
    setSelected("");
  }, [templateId]);

  const refresh = () => setNames(listPresetNames(templateId));

  const handleSave = () => {
    const name = window.prompt("儲存這組參數,取個名字:");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    savePreset(templateId, trimmed, values);
    refresh();
    setSelected(trimmed);
  };

  const handleLoad = (name: string) => {
    setSelected(name);
    if (!name) return;
    const preset = loadPreset(templateId, name);
    if (preset) onLoad(preset);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!window.confirm(`刪除設定「${selected}」?`)) return;
    deletePreset(templateId, selected);
    setSelected("");
    refresh();
  };

  return (
    <div className="preset-bar">
      <select
        className="preset-bar__select"
        value={selected}
        onChange={(e) => handleLoad(e.target.value)}
        aria-label="讀取已儲存的設定"
      >
        <option value="">{names.length ? "讀取已存設定…" : "尚無已存設定"}</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button type="button" className="preset-bar__btn" onClick={handleSave}>
        儲存目前設定
      </button>
      <button
        type="button"
        className="preset-bar__btn preset-bar__btn--danger"
        onClick={handleDelete}
        disabled={!selected}
        title="刪除選取的設定"
      >
        刪除
      </button>
    </div>
  );
}
