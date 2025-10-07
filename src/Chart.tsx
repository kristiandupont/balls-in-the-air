import * as d3 from "d3";
import { data } from "./data";
import type { Context } from "@b9g/crank";

// Define the data structure type
export interface NodeData {
  name: string;
  value?: number;
  children?: NodeData[];
}

// Inner component that creates the actual D3 chart
function* D3ChartInner(
  this: Context,
  { width, height }: { width: number; height: number }
) {
  let chartMounted = false;

  // Function to create the chart
  const createChart = () => {
    const margin = 1; // to avoid clipping the root circle stroke
    const size = Math.min(width, height);
    const chartWidth = size;
    const chartHeight = size;

    // Specify the number format for values
    const format = d3.format(",d");

    // Create the pack layout
    const pack = d3
      .pack<NodeData>()
      .size([chartWidth - margin * 2, chartHeight - margin * 2])
      .padding(3);

    // Compute the hierarchy from the JSON data
    const root = pack(
      d3
        .hierarchy(data)
        .sum((d) => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
    );

    // Create the SVG container
    const svg = d3
      .create("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("viewBox", [-margin, -margin, chartWidth, chartHeight])
      .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
      .attr("text-anchor", "middle");

    // Place each node according to the layout's x and y values
    const node = svg
      .append("g")
      .selectAll()
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Add a title
    node.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => (d.data as NodeData).name)
          .reverse()
          .join("/")}\n${format(d.value || 0)}`
    );

    // Add a filled or stroked circle
    node
      .append("circle")
      .attr("fill", (d) => (d.children ? "#fff" : "#ddd"))
      .attr("stroke", (d) => (d.children ? "#bbb" : null))
      .attr("r", (d) => d.r);

    // Add a label to leaf nodes
    const text = node
      .filter((d) => !d.children && d.r > 10)
      .append("text")
      .attr("clip-path", (d) => `circle(${d.r})`);

    // Add a tspan for each CamelCase-separated word
    text
      .selectAll()
      .data((d) => (d.data as NodeData).name.split(/(?=[A-Z][a-z])|\s+/g))
      .join("tspan")
      .attr("x", 0)
      .attr("y", (_, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
      .text((d) => d);

    // Add a tspan for the node's value
    text
      .append("tspan")
      .attr("x", 0)
      .attr(
        "y",
        (d) =>
          `${
            (d.data as NodeData).name.split(/(?=[A-Z][a-z])|\s+/g).length / 2 +
            0.35
          }em`
      )
      .attr("fill-opacity", 0.7)
      .text((d) => format(d.value || 0));

    return svg;
  };

  for (const _ of this) {
    yield (
      <div
        ref={(el: HTMLDivElement | null) => {
          if (el && !chartMounted) {
            el.innerHTML = "";
            const chartSvg = createChart();
            el.appendChild(chartSvg.node()!);
            chartMounted = true;
          }
        }}
        class="w-full h-full flex items-center justify-center"
      />
    );
  }
}

// Outer component that determines dimensions and passes them to inner component
export function* D3CirclePackingChart(this: Context) {
  let containerRef: HTMLDivElement | null = null;
  let dimensions = { width: 400, height: 400 }; // fallback dimensions
  let resizeObserver: ResizeObserver | null = null;

  // Function to update dimensions
  const updateDimensions = () => {
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height) || 400;
      dimensions = { width: size, height: size };
    }
  };

  for (const _ of this) {
    yield (
      <div class="w-full h-full flex items-center justify-center">
        <div
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              containerRef = el;
              updateDimensions();

              // Set up resize observer
              if (!resizeObserver) {
                resizeObserver = new ResizeObserver(() => {
                  updateDimensions();
                });
                resizeObserver.observe(el);
              }
            }
          }}
          class="size-full max-w-4xl"
        >
          <D3ChartInner width={dimensions.width} height={dimensions.height} />
        </div>
      </div>
    );
  }

  // Cleanup on component unmount
  if (resizeObserver) {
    (resizeObserver as ResizeObserver).disconnect();
  }
}
