/** @jsxImportSource @b9g/crank */

import "./style.css";
import { renderer } from "@b9g/crank/dom";
import { BallsChart } from "./Chart";

const Home = () => (
  <div class="flex h-screen flex-col bg-gray-50">
    <div class="absolute left-0 top-0 flex h-full w-full items-center justify-center overflow-y-auto">
      <div class="flex flex-col items-center justify-start h-full w-full">
        <h1 class="text-4xl bg-gradient-to-r from-blue-500 to-purple-600 w-full text-center py-6 text-white shadow-lg select-none">
          Balls in the Air
        </h1>
        <div class="w-full flex-1 bg-white shadow-lg">
          <BallsChart />
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
