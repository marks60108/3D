import type { StackItem, StackOp, StackShape } from "../lib/customStack";

interface StackEditorProps {
  items: StackItem[];
  onAdd: (shape: StackShape) => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<StackItem>) => void;
}

function numberField(
  label: string,
  value: number,
  onChange: (v: number) => void,
  step = 1
) {
  return (
    <label className="stack-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function StackEditor({ items, onAdd, onRemove, onChange }: StackEditorProps) {
  return (
    <div className="stack-editor">
      <div className="stack-editor__toolbar">
        <button onClick={() => onAdd("box")}>+ 方塊</button>
        <button onClick={() => onAdd("cylinder")}>+ 圓柱</button>
      </div>

      {items.length === 0 && (
        <p className="stack-editor__empty">尚未加入任何物件,點上方按鈕新增第一個方塊或圓柱。</p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="stack-item">
          <div className="stack-item__header">
            <strong>
              #{index + 1} {item.shape === "box" ? "方塊" : "圓柱"}
            </strong>
            {index > 0 && (
              <select
                value={item.op}
                onChange={(e) => onChange(item.id, { op: e.target.value as StackOp })}
              >
                <option value="union">聯集(加上)</option>
                <option value="subtract">差集(挖除)</option>
              </select>
            )}
            <button className="stack-item__remove" onClick={() => onRemove(item.id)}>
              刪除
            </button>
          </div>

          <div className="stack-item__grid">
            {item.shape === "box" ? (
              <>
                {numberField("X 尺寸", item.sizeX, (v) => onChange(item.id, { sizeX: v }))}
                {numberField("Y 尺寸", item.sizeY, (v) => onChange(item.id, { sizeY: v }))}
                {numberField("Z 尺寸", item.sizeZ, (v) => onChange(item.id, { sizeZ: v }))}
              </>
            ) : (
              <>
                {numberField("直徑", item.diameter, (v) => onChange(item.id, { diameter: v }))}
                {numberField("高度", item.height, (v) => onChange(item.id, { height: v }))}
              </>
            )}
          </div>
          <div className="stack-item__grid">
            {numberField("中心 X", item.posX, (v) => onChange(item.id, { posX: v }))}
            {numberField("中心 Y", item.posY, (v) => onChange(item.id, { posY: v }))}
            {numberField("中心 Z", item.posZ, (v) => onChange(item.id, { posZ: v }))}
          </div>
          <div className="stack-item__grid">
            {numberField("旋轉 X°", item.rotX, (v) => onChange(item.id, { rotX: v }), 5)}
            {numberField("旋轉 Y°", item.rotY, (v) => onChange(item.id, { rotY: v }), 5)}
            {numberField("旋轉 Z°", item.rotZ, (v) => onChange(item.id, { rotZ: v }), 5)}
          </div>
        </div>
      ))}
    </div>
  );
}
