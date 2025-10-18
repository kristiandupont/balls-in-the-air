/** @jsxImportSource @b9g/crank */

import "./style.css";
import { renderer } from "@b9g/crank/dom";
import { BallsChart } from "./Chart";

const Home = () => (
  <div class="h-screen w-screen bg-white overflow-hidden">
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
