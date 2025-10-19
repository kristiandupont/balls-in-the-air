import type { Context } from "@b9g/crank";

interface InfoHoverProps {
  text: string;
}

export function* InfoHover(this: Context, { text }: InfoHoverProps) {
  let isHovered = false;

  const handleMouseEnter = () =>
    this.refresh(() => {
      isHovered = true;
    });

  const handleMouseLeave = () =>
    this.refresh(() => {
      isHovered = false;
    });

  for ({ text } of this) {
    yield (
      <div class="relative inline-block">
        {/* Info icon */}
        <div
          class="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center text-gray-400 font-serif text-xs"
          onmouseenter={handleMouseEnter}
          onmouseleave={handleMouseLeave}
        >
          i
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg z-50">
            <div class="relative">
              {text}
              {/* Arrow pointing down */}
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
