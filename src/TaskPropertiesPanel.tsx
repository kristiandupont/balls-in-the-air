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

export function* TaskPropertiesPanel(
  this: Context,
  {
    selectedBall,
    isNewlyCreated,
    onBump,
    onUpdate,
    onDelete,
  }: TaskPropertiesPanelProps
) {
  let isEditingDate = false;

  for ({ selectedBall, isNewlyCreated, onBump, onUpdate, onDelete } of this) {
    yield (
      <div class="fixed right-6 top-6 w-80 bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col gap-4 max-h-[calc(100vh-3rem)] overflow-y-auto z-50">
        <div class="flex flex-col gap-2">
          <textarea
            value={selectedBall.name}
            rows={3}
            ref={(el: HTMLTextAreaElement | null) => {
              if (el && isNewlyCreated) {
                this.after(() => {
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
          {isEditingDate ? (
            <input
              type="date"
              value={
                new Date(selectedBall.lastBumped).toISOString().split("T")[0]
              }
              oninput={(e: Event) => {
                const dateString = (e.target as HTMLInputElement).value;
                if (dateString) {
                  const newDate = new Date(dateString);
                  onUpdate({ lastBumped: newDate.getTime() });
                }
              }}
              onblur={() =>
                this.refresh(() => {
                  isEditingDate = false;
                })
              }
              ref={(el: HTMLInputElement | null) => {
                if (el) {
                  // eslint-disable-next-line crank/require-cleanup-for-timers
                  setTimeout(() => el.focus(), 0);
                }
              }}
              class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div class="group flex items-center gap-2">
              <p class="text-sm text-gray-600">
                {new Date(selectedBall.lastBumped).toLocaleDateString()} (
                {Math.floor(
                  (Date.now() - selectedBall.lastBumped) / MILLISECONDS_PER_DAY
                )}{" "}
                days ago)
              </p>
              <button
                onclick={() =>
                  this.refresh(() => {
                    isEditingDate = true;
                  })
                }
                class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                title="Edit date"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )}
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
              const value =
                parseInt((e.target as HTMLInputElement).value) / 100;
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
}
