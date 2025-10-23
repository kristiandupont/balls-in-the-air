/** @jsxImportSource @b9g/crank */

import "./style.css";
import { renderer } from "@b9g/crank/dom";
import { TaskArena } from "./TaskArena";
import type { Context } from "@b9g/crank";

function* Home(this: Context) {
  let helpCardVisible = false;

  const showHelpCard = () =>
    this.refresh(() => {
      console.log("showHelpCard");
      helpCardVisible = true;
    });

  const hideHelpCard = () =>
    this.refresh(() => {
      helpCardVisible = false;
    });

  for ({} of this) {
    yield (
      <div class="h-screen w-screen bg-white overflow-hidden">
        {/* Help button in upper left corner */}
        <button
          onclick={helpCardVisible ? hideHelpCard : showHelpCard}
          class="absolute cursor-pointer top-4 right-4 z-20 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 text-xl font-bold transition-colors"
          title="Help"
        >
          ?
        </button>
        <div
          class={`absolute z-20 inset-0 flex items-center justify-center pointer-events-auto bg-black/50 ${
            helpCardVisible ? "block" : "hidden"
          }`}
        >
          <div class="bg-white text-gray-900 p-6 rounded-lg max-w-md mx-4 shadow-xl">
            <h2 class="text-2xl font-bold mb-4">Balls in the Air</h2>
            <p class="mb-4">
              A visual task management tool where tasks grow over time until you
              "bump" them. Think of it as a live todo list that keeps important
              recurring tasks visible.
            </p>
            <button
              onclick={hideHelpCard}
              class="w-full cursor-pointer bg-gray-900 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
        {/* Title in background */}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <h1 class="text-[16vw] font-black text-gray-100 tracking-[-0.07em]">
            Balls in the Air
          </h1>
        </div>
        <TaskArena />
      </div>
    );
  }
}

(async () => {
  await renderer.render(
    <div>
      <Home />
    </div>,
    document.body
  );
})();
