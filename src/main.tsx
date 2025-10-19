/** @jsxImportSource @b9g/crank */

import "./style.css";
import { renderer } from "@b9g/crank/dom";
import { BallsChart } from "./Chart";

const Home = () => (
  <div class="h-screen w-screen bg-white overflow-hidden">
    {/* Title in background */}
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
      <h1 class="text-[16vw] font-black text-gray-100 tracking-[-7%]">
        Balls in the Air
      </h1>
    </div>
    <BallsChart />
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
