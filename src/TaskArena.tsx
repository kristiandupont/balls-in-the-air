import type { Context } from "@b9g/crank";
import { TaskController } from "./TaskController";

// Container component that handles resizing and passes dimensions to controller
export function* TaskArena(this: Context) {
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
          <TaskController width={dimensions.width} height={dimensions.height} />
        </div>
      </div>
    );
  }

  if (resizeObserver) {
    (resizeObserver as ResizeObserver).disconnect();
  }
}
