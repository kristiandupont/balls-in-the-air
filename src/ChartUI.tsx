import type { Context } from "@b9g/crank";
import type { Ball } from "./storage";
import { calculateRadius, MILLISECONDS_PER_DAY } from "./storage";

interface SidebarProps {
  selectedBall: Ball | null;
  onBump: () => void;
  onUpdate: (updates: Partial<Ball>) => void;
  onDelete: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export function* Sidebar(
  this: Context,
  { selectedBall, onBump, onUpdate, onDelete, onAdd, onClose }: SidebarProps
) {
  let nameInput = selectedBall?.name || "";
  let growthRateInput = selectedBall?.growthRate.toString() || "2";

  for ({
    selectedBall,
    onBump,
    onUpdate,
    onDelete,
    onAdd,
    onClose,
  } of this) {
    // Update local state when selectedBall changes
    nameInput = selectedBall?.name || "";
    growthRateInput = selectedBall?.growthRate.toString() || "2";

    yield (
      <div class="w-80 bg-white border-l border-gray-200 p-6 flex flex-col gap-4 overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">
            {selectedBall ? "Edit Ball" : "Balls in the Air"}
          </h2>
          {selectedBall && (
            <button
              class="text-gray-500 hover:text-gray-700"
              onclick={onClose}
            >
              ✕
            </button>
          )}
        </div>

        {selectedBall ? (
          <>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Name</label>
              <textarea
                value={nameInput}
                rows={3}
                oninput={(e: Event) => {
                  nameInput = (e.target as HTMLTextAreaElement).value;
                }}
                onchange={(e: Event) => {
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
                value={growthRateInput}
                oninput={(e: Event) => {
                  growthRateInput = (e.target as HTMLInputElement).value;
                }}
                onchange={(e: Event) => {
                  const value = parseFloat(
                    (e.target as HTMLInputElement).value
                  );
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
              <div
                class="w-12 h-12 rounded-lg border-2 self-center"
                style={`background: hsl(${selectedBall.hue ?? 210}, 75%, 65%); border-color: hsl(${selectedBall.hue ?? 210}, 75%, 45%);`}
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">
                Text Size {selectedBall.textScale ? `(${Math.round(selectedBall.textScale * 100)}%)` : "(Auto)"}
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
              <p class="text-xs text-gray-500">
                Drag to adjust text size (auto-fit by default)
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">
                Last bumped
              </label>
              <p class="text-sm text-gray-600">
                {new Date(selectedBall.lastBumped).toLocaleDateString()} (
                {Math.floor((Date.now() - selectedBall.lastBumped) / MILLISECONDS_PER_DAY)}{" "}
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
              Delete Ball
            </button>
          </>
        ) : (
          <>
            <p class="text-gray-600">
              Click a ball to edit it, or add a new one.
            </p>
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              onclick={onAdd}
            >
              + Add New Ball
            </button>
          </>
        )}
      </div>
    );
  }
}
