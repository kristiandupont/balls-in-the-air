import * as d3 from "d3";
import { data } from "./data";

// Define the data structure type
export interface NodeData {
  name: string;
  value?: number;
  children?: NodeData[];
}

// Specify the dimensions of the chart.
const width = 928;
const height = width;
const margin = 1; // to avoid clipping the root circle stroke

// Specify the number format for values.
const format = d3.format(",d");

// Create the pack layout.
const pack = d3
  .pack<NodeData>()
  .size([width - margin * 2, height - margin * 2])
  .padding(3);

// Compute the hierarchy from the JSON data; recursively sum the
// values for each node; sort the tree by descending value; lastly
// apply the pack layout.
const root = pack(
  d3
    .hierarchy(data)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
);

// Create the SVG container.
const svg = d3
  .create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [-margin, -margin, width, height])
  .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
  .attr("text-anchor", "middle");

// Place each node according to the layout’s x and y values.
const node = svg
  .append("g")
  .selectAll()
  .data(root.descendants())
  .join("g")
  .attr("transform", (d) => `translate(${d.x},${d.y})`);

// Add a title.
node.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .map((d) => (d.data as NodeData).name)
      .reverse()
      .join("/")}\n${format(d.value || 0)}`
);

// Add a filled or stroked circle.
node
  .append("circle")
  .attr("fill", (d) => (d.children ? "#fff" : "#ddd"))
  .attr("stroke", (d) => (d.children ? "#bbb" : null))
  .attr("r", (d) => d.r);

// Add a label to leaf nodes.
const text = node
  .filter((d) => !d.children && d.r > 10)
  .append("text")
  .attr("clip-path", (d) => `circle(${d.r})`);

// Add a tspan for each CamelCase-separated word.
text
  .selectAll()
  .data((d) => (d.data as NodeData).name.split(/(?=[A-Z][a-z])|\s+/g))
  .join("tspan")
  .attr("x", 0)
  .attr("y", (_, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
  .text((d) => d);

// Add a tspan for the node's value.
text
  .append("tspan")
  .attr("x", 0)
  .attr(
    "y",
    (d) =>
      `${
        (d.data as NodeData).name.split(/(?=[A-Z][a-z])|\s+/g).length / 2 + 0.35
      }em`
  )
  .attr("fill-opacity", 0.7)
  .text((d) => format(d.value || 0));

// CrankJS component that renders the D3 circle packing chart
export function* D3CirclePackingChart(this: any) {
  let chartMounted = false;

  // Initial render
  yield (
    <div class="w-full h-full flex items-center justify-center">
      <div
        ref={(el: HTMLDivElement | null) => {
          if (el && !chartMounted) {
            containerRef = el;
            // Mount the chart immediately when ref is available
            el.innerHTML = "";
            el.appendChild(svg.node()!);
            chartMounted = true;
          }
        }}
        class="w-full max-w-4xl h-auto"
        style="display: flex; justify-content: center; align-items: center;"
      />
    </div>
  );

  // Keep the component alive and re-render if needed
  for (const _ of this) {
    yield (
      <div class="w-full h-full flex items-center justify-center">
        <div
          ref={(el: HTMLDivElement | null) => {
            if (el && !chartMounted) {
              containerRef = el;
              // Mount the chart immediately when ref is available
              el.innerHTML = "";
              el.appendChild(svg.node()!);
              chartMounted = true;
            }
          }}
          class="w-full max-w-4xl h-auto"
          style="display: flex; justify-content: center; align-items: center;"
        />
      </div>
    );
  }
}

// Export the SVG for external use if needed
export { svg };
