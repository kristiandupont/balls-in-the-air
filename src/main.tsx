/** @jsxImportSource @b9g/crank */

import "./style.css";
import { renderer } from "@b9g/crank/dom";
import { D3CirclePackingChart } from "./Chart";

const Home = () => (
  <div class="flex h-screen flex-col bg-cyan-700">
    <div class="absolute left-0 top-0 flex h-full w-full items-center justify-center overflow-y-auto">
      <div class="flex flex-col items-center justify-start py-12 h-full w-full max-w-screen-lg space-y-12">
        <h1 class="text-6xl bg-orange-400 rounded-xl w-full text-center py-6 text-white shadow-2xl select-none">
          D3 Circle Packing Chart
        </h1>
        <div class="w-full h-full bg-white rounded-xl shadow-2xl p-4">
          <D3CirclePackingChart />
        </div>
      </div>
    </div>
  </div>
);

(async () => {
  await renderer.render(
    <div>
      <Home />
    </div>,
    document.body
  );
})();
