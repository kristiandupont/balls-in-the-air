import type { Context } from "@b9g/crank";
import type { Ball } from "./storage";
import { calculateRadius, MILLISECONDS_PER_DAY } from "./storage";

interface TaskPropertiesPanelProps {
  selectedBall: Ball;
  isNewlyCreated: boolean;
  onBump: () => void;
  onUpdate: (updates: Partial<Ball>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TaskPropertiesPanel(
  {
    selectedBall,
    isNewlyCreated,
    onBump,
    onUpdate,
    onDelete,
    onClose,
  }: TaskPropertiesPanelProps,
  ctx: Context
) {
  return (
    <div class="fixed right-6 top-6 w-80 bg-white rounded-lg shadow p-6 flex flex-col gap-4 max-h-[calc(100vh-3rem)] overflow-y-auto z-50">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-800">Edit Task</h2>
        <button
          class="text-gray-500 hover:text-gray-700 cursor-pointer"
          onclick={onClose}
        >
          ✕
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Name</label>
        <textarea
          value={selectedBall.name}
          rows={3}
          ref={(el: HTMLTextAreaElement | null) => {
            if (el && isNewlyCreated) {
              ctx.after(() => {
                el.select();
                el.focus();
              });
            }
          }}
          oninput={(e: Event) => {
            const value = (e.target as HTMLTextAreaElement).value;
            if (value.trim()) {
              onUpdate({ name: value });
            }
          }}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">
          Growth Rate (px/day)
        </label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={selectedBall.growthRate}
          onchange={(e: Event) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(value) && value > 0) {
              onUpdate({ growthRate: value });
            }
          }}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-xs text-gray-500">
          Current size: {Math.round(calculateRadius(selectedBall))}px
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Color</label>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedBall.hue ?? 210}
          oninput={(e: Event) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            onUpdate({ hue: value });
          }}
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={`background: linear-gradient(to right,
            hsl(0, 75%, 65%),
            hsl(60, 75%, 65%),
            hsl(120, 75%, 65%),
            hsl(180, 75%, 65%),
            hsl(240, 75%, 65%),
            hsl(300, 75%, 65%),
            hsl(360, 75%, 65%)
          );`}
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">
          Text Size{" "}
          {selectedBall.textScale
            ? `(${Math.round(selectedBall.textScale * 100)}%)`
            : "(Auto)"}
        </label>
        <input
          type="range"
          min="50"
          max="200"
          value={(selectedBall.textScale ?? 1.0) * 100}
          oninput={(e: Event) => {
            const value = parseInt((e.target as HTMLInputElement).value) / 100;
            onUpdate({ textScale: value });
          }}
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Last bumped</label>
        <p class="text-sm text-gray-600">
          {new Date(selectedBall.lastBumped).toLocaleDateString()} (
          {Math.floor(
            (Date.now() - selectedBall.lastBumped) / MILLISECONDS_PER_DAY
          )}{" "}
          days ago)
        </p>
      </div>

      <button
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        onclick={onBump}
      >
        Bump (Reset Timer)
      </button>

      <button
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium mt-auto"
        onclick={onDelete}
      >
        Delete Task
      </button>
    </div>
  );
}
