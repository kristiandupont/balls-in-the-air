import type { Context } from "@b9g/crank";
import { loadBalls, saveBalls, type Ball } from "./storage";
import { TaskSimulation } from "./TaskSimulation";
import { TaskPropertiesPanel } from "./TaskPropertiesPanel";

// Controller component that manages state and interactions
export function* TaskController(
  this: Context,
  { width, height }: { width: number; height: number }
) {
  let selectedBallId: string | null = null;
  let balls: Ball[] = loadBalls();
  let isNewlyCreated = false;

  const getSelectedBall = (): Ball | null => {
    return balls.find((b) => b.id === selectedBallId) || null;
  };

  const refresh = () => {
    // eslint-disable-next-line crank/prefer-refresh-callback
    this.refresh();
  };

  // Update ball sizes periodically (every 300ms for smooth growth)
  const updateInterval = setInterval(() => {
    refresh();
  }, 300);

  // Cleanup interval on unmount
  this.cleanup(() => {
    clearInterval(updateInterval);
  });

  const handleBallClick = (ballId: string | null) => {
    if (ballId === null) {
      // Background click - deselect
      selectedBallId = null;
    } else {
      // Toggle selection by ID
      selectedBallId = selectedBallId === ballId ? null : ballId;
    }

    isNewlyCreated = false;
    refresh();
  };

  const handleBump = () => {
    if (!selectedBallId) return;

    balls = balls.map((b) =>
      b.id === selectedBallId ? { ...b, lastBumped: Date.now() } : b
    );
    saveBalls(balls);
    refresh();
  };

  const handleUpdate = (updates: Partial<Ball>) => {
    if (!selectedBallId) return;

    balls = balls.map((b) =>
      b.id === selectedBallId ? { ...b, ...updates } : b
    );
    saveBalls(balls);
    refresh();
  };

  const handleDelete = () => {
    if (!selectedBallId) return;

    balls = balls.filter((b) => b.id !== selectedBallId);
    saveBalls(balls);
    selectedBallId = null;
    refresh();
  };

  const handleAdd = () => {
    const newBall: Ball = {
      id: Date.now().toString(),
      name: "New Task",
      lastBumped: Date.now(),
      growthRate: 2,
    };

    balls = [...balls, newBall];
    selectedBallId = newBall.id;
    isNewlyCreated = true;

    // Save after positions are initialized
    setTimeout(() => saveBalls(balls), 100);
    refresh();
  };

  for ({ width, height } of this) {
    yield (
      <>
        <div class="w-full h-full relative">
          {/* Simulation */}
          <div class="w-full h-full relative z-10">
            <TaskSimulation
              balls={balls}
              width={width}
              height={height}
              onBallClick={handleBallClick}
              selectedBall={getSelectedBall()}
            />
          </div>
        </div>

        {/* Floating UI elements */}
        {getSelectedBall() && (
          <TaskPropertiesPanel
            selectedBall={getSelectedBall()!}
            isNewlyCreated={isNewlyCreated}
            onBump={handleBump}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}

        {/* Add button */}
        <button
          class="fixed left-6 bottom-6 w-16 h-16 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-300 cursor-pointer transition-colors shadow flex items-center justify-center z-50"
          onclick={handleAdd}
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
