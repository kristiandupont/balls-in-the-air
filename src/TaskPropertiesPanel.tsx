import type { Context } from "@b9g/crank";
import type { Ball } from "./storage";
import { MILLISECONDS_PER_DAY } from "./storage";
import { InfoHover } from "./InfoHover";

interface TaskPropertiesPanelProps {
  selectedBall: Ball;
  isNewlyCreated: boolean;
  onBump: () => void;
  onUpdate: (updates: Partial<Ball>) => void;
  onDelete: () => void;
}

export function TaskPropertiesPanel(
  {
    selectedBall,
    isNewlyCreated,
    onBump,
    onUpdate,
    onDelete,
  }: TaskPropertiesPanelProps,
  ctx: Context
) {
  return (
    <div class="fixed right-6 top-6 w-80 bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col gap-4 max-h-[calc(100vh-3rem)] overflow-y-auto z-50">
      <div class="flex flex-col gap-2">
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

      <button
        class="px-4 py-2 border-2 cursor-pointer bg-gray-50 border-gray-300 rounded shadow hover:border-gray-400 transition-colors font-medium"
        onclick={onBump}
      >
        Bump (Reset Timer)
      </button>

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

      <hr class="border-gray-200" />

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium flex items-center gap-2 text-gray-700">
          <span>Growth Rate (px/day)</span>
          <InfoHover text="For a task that to recur every 30 days, a growth rate of 6 works well. Try setting to a high number like 50000 for fun!" />
        </label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={selectedBall.growthRate}
          oninput={(e: Event) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(value) && value > 0) {
              onUpdate({ growthRate: value });
            }
          }}
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
        <label class="text-sm font-medium text-gray-700">Text Size</label>
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

      <button
        class="px-4 py-2 border-2 cursor-pointer bg-gray-50 border-red-700 text-red-700 rounded shadow hover:border-red-800 transition-colors font-medium mt-auto"
        onclick={onDelete}
      >
        Delete Task
      </button>
    </div>
  );
}
