import type { Context } from "@b9g/crank";
import type { Ball } from "./storage";
import { TARGET_BALL_RADIUS } from "./storage";
import { formatDuration, formatRelativeTime } from "./formatTime";
import { dueTime, isOverdue, overdueBy } from "./dueness";
import {
  FREQUENCY_UNITS,
  formatFrequency,
  frequencyToDays,
  splitFrequency,
  type FrequencyUnit,
} from "./frequency";
import { InfoHover } from "./InfoHover";

interface TaskPropertiesPanelProps {
  selectedBall: Ball;
  isNewlyCreated: boolean;
  onBump: () => void;
  onUpdate: (updates: Partial<Ball>) => void;
  onDelete: () => void;
}

const HOUR = 1000 * 60 * 60;

const toDateInputValue = (timestamp: number) =>
  new Date(timestamp).toISOString().split("T")[0];

const PencilIcon = () => (
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
);

const CheckIcon = () => (
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
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export function* TaskPropertiesPanel(
  this: Context,
  {
    selectedBall,
    isNewlyCreated,
    onBump,
    onUpdate,
    onDelete,
  }: TaskPropertiesPanelProps,
) {
  let isEditing = isNewlyCreated;
  let isEditingDate = false;
  let currentBallId = selectedBall.id;

  // Draft values for the text inputs. They are kept locally so that an
  // intermediate empty or invalid value is not written back to the ball, and
  // so that the periodic re-render does not overwrite what is being typed.
  let draftName = selectedBall.name;
  let draftDate = "";
  let draftFrequency = String(
    splitFrequency(selectedBall.frequencyDays).amount,
  );
  let frequencyUnit: FrequencyUnit = splitFrequency(
    selectedBall.frequencyDays,
  ).unit;

  const resetDrafts = () => {
    draftName = selectedBall.name;
    const { amount, unit } = splitFrequency(selectedBall.frequencyDays);
    draftFrequency = String(amount);
    frequencyUnit = unit;
  };

  const handleNameInput = (e: Event) => {
    draftName = (e.target as HTMLTextAreaElement).value;
    if (draftName.trim()) {
      onUpdate({ name: draftName });
    }
  };

  // An empty name is not stored; restore the last saved one instead
  const handleNameBlur = () => {
    if (!draftName.trim()) {
      this.refresh(() => {
        draftName = selectedBall.name;
      });
    }
  };

  const commitFrequency = () => {
    const amount = parseFloat(draftFrequency);
    if (!isNaN(amount) && amount > 0) {
      onUpdate({ frequencyDays: frequencyToDays(amount, frequencyUnit) });
      return true;
    }
    return false;
  };

  const handleFrequencyInput = (e: Event) => {
    draftFrequency = (e.target as HTMLInputElement).value;
    commitFrequency();
  };

  const handleFrequencyBlur = () => {
    if (!commitFrequency()) {
      this.refresh(resetDrafts);
    }
  };

  // Keeps the number and reinterprets it in the new unit, so switching from
  // "7 days" to weeks stores 7 weeks
  const handleUnitChange = (e: Event) => {
    frequencyUnit = (e.target as HTMLSelectElement).value as FrequencyUnit;
    commitFrequency();
  };

  const toggleEditing = () =>
    this.refresh(() => {
      isEditing = !isEditing;
      isEditingDate = false;
      resetDrafts();
    });

  for ({ selectedBall, isNewlyCreated, onBump, onUpdate, onDelete } of this) {
    // Selecting a different ball starts over in view mode
    if (selectedBall.id !== currentBallId) {
      currentBallId = selectedBall.id;
      isEditing = isNewlyCreated;
      isEditingDate = false;
      resetDrafts();
    }

    const lastBumpedDate = new Date(selectedBall.lastBumped);
    const overdue = isOverdue(selectedBall);
    const remaining = dueTime(selectedBall) - Date.now();
    const dueLabel = overdue
      ? overdueBy(selectedBall) < HOUR
        ? "Due now"
        : `Overdue by ${formatDuration(overdueBy(selectedBall))}`
      : remaining < HOUR
        ? "Due now"
        : `Due in ${formatDuration(remaining)}`;

    yield (
      <div class="fixed right-6 top-6 w-80 bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col gap-4 max-h-[calc(100vh-3rem)] overflow-y-auto z-50">
        <div class="flex items-start gap-2">
          {isEditing ? (
            <textarea
              value={draftName}
              rows={3}
              ref={(el: HTMLTextAreaElement | null) => {
                if (el && isNewlyCreated) {
                  this.after(() => {
                    el.select();
                    el.focus();
                  });
                }
              }}
              oninput={handleNameInput}
              onblur={handleNameBlur}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <p class="flex-1 font-medium text-gray-900 whitespace-pre-wrap break-words">
              {selectedBall.name}
            </p>
          )}
          <button
            onclick={toggleEditing}
            class="shrink-0 p-1 cursor-pointer text-gray-400 hover:text-gray-700 transition-colors"
            title={isEditing ? "Done editing" : "Edit task"}
          >
            {isEditing ? <CheckIcon /> : <PencilIcon />}
          </button>
        </div>

        {!isEditing && (
          <div class="flex flex-col gap-1">
            <p class="text-sm text-gray-700">
              Last bumped {formatRelativeTime(selectedBall.lastBumped)}
            </p>
            <p
              class={
                overdue
                  ? "text-sm font-medium text-red-600"
                  : "text-sm text-gray-500"
              }
            >
              {dueLabel}
            </p>
            <p class="text-xs text-gray-400">
              {lastBumpedDate.toLocaleDateString()} &middot;{" "}
              {formatFrequency(selectedBall.frequencyDays)}
            </p>
          </div>
        )}

        <button
          class="px-4 py-2 border-2 cursor-pointer bg-gray-50 border-gray-300 rounded shadow hover:border-gray-400 transition-colors font-medium"
          onclick={onBump}
        >
          Bump (Reset Timer)
        </button>

        {isEditing && (
          <>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">
                Last bumped
              </label>
              {isEditingDate ? (
                <input
                  type="date"
                  value={draftDate}
                  oninput={(e: Event) => {
                    // A half-entered date reads as an empty value; only
                    // complete dates are stored
                    draftDate = (e.target as HTMLInputElement).value;
                    if (draftDate) {
                      onUpdate({ lastBumped: new Date(draftDate).getTime() });
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
                    {lastBumpedDate.toLocaleDateString()} (
                    {formatRelativeTime(selectedBall.lastBumped)})
                  </p>
                  <button
                    onclick={() =>
                      this.refresh(() => {
                        isEditingDate = true;
                        draftDate = toDateInputValue(selectedBall.lastBumped);
                      })
                    }
                    class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                    title="Edit date"
                  >
                    <PencilIcon />
                  </button>
                </div>
              )}
            </div>

            <hr class="border-gray-200" />

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium flex items-center gap-2 text-gray-700">
                <span>Frequency</span>
                <InfoHover
                  text={`How often you expect to do this task. The ball grows to a ${TARGET_BALL_RADIUS}px radius over that period, and keeps growing once it is overdue.`}
                />
              </label>
              <div class="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={draftFrequency}
                  oninput={handleFrequencyInput}
                  onblur={handleFrequencyBlur}
                  class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={frequencyUnit}
                  onchange={handleUnitChange}
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FREQUENCY_UNITS.map((unit) => (
                    <option value={unit} selected={unit === frequencyUnit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
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
          </>
        )}
      </div>
    );
  }
}
