import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { ManifoldToplevel, Manifold } from "manifold-3d";
import { getManifoldModule, manifoldToGeometry, manifoldBounds } from "./lib/manifold";
import { downloadStl } from "./lib/exportStl";
import { templates, defaultValues, templatesByCategory } from "./templates";
import type { ParamValues } from "./templates/types";
import { ParamPanel } from "./components/ParamPanel";
import { PresetBar } from "./components/PresetBar";
import { Viewport, BUILD_VOLUME } from "./components/Viewport";
import { StackEditor } from "./components/StackEditor";
import {
  buildCustomStack,
  newStackItem,
  type StackItem,
  type StackShape,
} from "./lib/customStack";
import "./App.css";

type Mode = "template" | "custom";

function App() {
  const [manifoldModule, setManifoldModule] = useState<ManifoldToplevel | null>(null);
  const [mode, setMode] = useState<Mode>("template");
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [values, setValues] = useState<ParamValues>(defaultValues(templates[0].params));
  const [stackItems, setStackItems] = useState<StackItem[]>([newStackItem("box")]);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [dimensions, setDimensions] = useState<[number, number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0],
    [templateId]
  );

  useEffect(() => {
    getManifoldModule().then(setManifoldModule);
  }, []);

  useEffect(() => {
    if (!manifoldModule) return;
    let manifold: Manifold | null = null;
    try {
      manifold =
        mode === "template"
          ? template.build(values, manifoldModule)
          : buildCustomStack(stackItems, manifoldModule);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setGeometry(null);
      setDimensions(null);
      return;
    }

    if (!manifold) {
      setGeometry(null);
      setDimensions(null);
      return;
    }

    const bounds = manifoldBounds(manifold);
    setDimensions([
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    ]);
    setGeometry(manifoldToGeometry(manifold));
  }, [manifoldModule, mode, template, values, stackItems]);

  const fits =
    dimensions !== null &&
    dimensions[0] <= BUILD_VOLUME[0] &&
    dimensions[1] <= BUILD_VOLUME[1] &&
    dimensions[2] <= BUILD_VOLUME[2];

  const handleParamChange = (key: string, value: number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleStackAdd = (shape: StackShape) => {
    setStackItems((prev) => [...prev, newStackItem(shape, prev.length === 0 ? "union" : "union")]);
  };

  const handleStackRemove = (id: string) => {
    setStackItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleStackChange = (id: string, patch: Partial<StackItem>) => {
    setStackItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleExport = () => {
    if (!geometry) return;
    const name = mode === "template" ? template.id : "custom-model";
    downloadStl(geometry, name);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>P2S 3D 建模工具</h1>
        <div className="app__mode-switch">
          <button className={mode === "template" ? "active" : ""} onClick={() => setMode("template")}>
            模板
          </button>
          <button className={mode === "custom" ? "active" : ""} onClick={() => setMode("custom")}>
            自訂堆疊
          </button>
        </div>
      </header>

      <div className="app__body">
        <aside className="app__panel">
          {mode === "template" ? (
            <>
              <label className="template-select">
                <span>選擇模板</span>
                <select
                  value={templateId}
                  onChange={(e) => {
                    const next = templates.find((t) => t.id === e.target.value) ?? templates[0];
                    setTemplateId(next.id);
                    setValues(defaultValues(next.params));
                  }}
                >
                  {templatesByCategory().map((group) => (
                    <optgroup key={group.category} label={group.label}>
                      {group.items.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <p className="template-description">{template.description}</p>
              <PresetBar templateId={template.id} values={values} onLoad={setValues} />
              <div className="template-actions">
                <button
                  type="button"
                  className="reset-button"
                  onClick={() => setValues(defaultValues(template.params))}
                >
                  重置此模板為預設值
                </button>
              </div>
              <ParamPanel params={template.params} values={values} onChange={handleParamChange} />
            </>
          ) : (
            <StackEditor
              items={stackItems}
              onAdd={handleStackAdd}
              onRemove={handleStackRemove}
              onChange={handleStackChange}
            />
          )}

          <div className="app__footer">
            {dimensions && (
              <p className={`dimensions ${fits ? "" : "dimensions--overflow"}`}>
                尺寸:{dimensions.map((d) => d.toFixed(1)).join(" x ")} mm
                {!fits && " — 超出 P2S 列印範圍 (256mm³)"}
              </p>
            )}
            {error && <p className="error">建模錯誤: {error}</p>}
            <button className="export-button" disabled={!geometry} onClick={handleExport}>
              下載 STL
            </button>
          </div>
        </aside>

        <main className="app__viewport">
          {!manifoldModule ? (
            <div className="loading">載入建模引擎中…</div>
          ) : (
            <Viewport geometry={geometry} fits={fits} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
