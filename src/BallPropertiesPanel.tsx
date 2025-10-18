import type { Context } from "@b9g/crank";
import type { Ball } from "./storage";
import { calculateRadius, MILLISECONDS_PER_DAY } from "./storage";

interface BallPropertiesPanelProps {
  selectedBall: Ball | null;
  onBump: () => void;
  onUpdate: (updates: Partial<Ball>) => void;
  onDelete: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export function* BallPropertiesPanel(
  this: Context,
  {
    selectedBall,
    onBump,
    onUpdate,
    onDelete,
    onAdd,
    onClose,
  }: BallPropertiesPanelProps
) {
  let nameInput = selectedBall?.name || "";
  let growthRateInput = selectedBall?.growthRate.toString() || "2";

  for ({ selectedBall, onBump, onUpdate, onDelete, onAdd, onClose } of this) {
    // Update local state when selectedBall changes
    nameInput = selectedBall?.name || "";
    growthRateInput = selectedBall?.growthRate.toString() || "2";

    yield (
      <>
        {selectedBall ? (
          <div class="fixed right-6 top-6 w-80 bg-white rounded-lg shadow p-6 flex flex-col gap-4 max-h-[calc(100vh-3rem)] overflow-y-auto z-50">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-800">Edit Ball</h2>
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
                style={`background: hsl(${
                  selectedBall.hue ?? 210
                }, 75%, 65%); border-color: hsl(${
                  selectedBall.hue ?? 210
                }, 75%, 45%);`}
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
                  const value =
                    parseInt((e.target as HTMLInputElement).value) / 100;
                  onUpdate({ textScale: value });
                }}
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">
                Last bumped
              </label>
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
              Delete Ball
            </button>
          </div>
        ) : null}

        <button
          class="fixed left-6 bottom-6 w-16 h-16 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-600 cursor-pointer transition-colors shadow flex items-center justify-center z-50"
          onclick={onAdd}
          title="Add New Ball"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </>
    );
  }
}
