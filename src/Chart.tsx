import type { Context } from "@b9g/crank";
import { loadBalls, saveBalls, type Ball } from "./storage";
import { CrankChart } from "./CrankChart";
import { BallPropertiesPanel } from "./BallPropertiesPanel";

// Inner component that creates the Crank chart
function* ChartInner(
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

  const handleClose = () => {
    selectedBallId = null;
    isNewlyCreated = false;
    refresh();
  };

  for ({ width, height } of this) {
    yield (
      <>
        <div class="w-full h-full relative">
          {/* Title in background */}
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <h1 class="text-[16vw] font-black text-gray-100 tracking-[-7%]">
              Balls in the Air
            </h1>
          </div>

          {/* Chart */}
          <div class="w-full h-full relative z-10">
            <CrankChart
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
          <BallPropertiesPanel
            selectedBall={getSelectedBall()!}
            isNewlyCreated={isNewlyCreated}
            onBump={handleBump}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={handleClose}
          />
        )}

        {/* Add button */}
        <button
          class="fixed left-6 bottom-6 w-16 h-16 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-600 cursor-pointer transition-colors shadow flex items-center justify-center z-50"
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

// Outer component that determines dimensions and passes them to inner component
export function* BallsChart(this: Context) {
  let containerRef: HTMLDivElement | null = null;
  let dimensions = { width: 800, height: 600 };
  let resizeObserver: ResizeObserver | null = null;

  const updateDimensions = () => {
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      dimensions = {
        width: rect.width || 800,
        height: rect.height || 600,
      };
    }
  };

  for ({} of this) {
    yield (
      <div class="w-full h-full">
        <div
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              containerRef = el;
              updateDimensions();

              if (!resizeObserver) {
                resizeObserver = new ResizeObserver(() => {
                  updateDimensions();
                });
                resizeObserver.observe(el);
              }
            }
          }}
          class="size-full"
        >
          <ChartInner width={dimensions.width} height={dimensions.height} />
        </div>
      </div>
    );
  }

  if (resizeObserver) {
    (resizeObserver as ResizeObserver).disconnect();
  }
}
