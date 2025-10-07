import * as d3 from "d3";
import { data } from "./data";

// Define the data structure type
export interface NodeData {
  name: string;
  value?: number;
  children?: NodeData[];
}

// CrankJS component that renders the D3 circle packing chart
export function* D3CirclePackingChart(this: any) {
  let chartMounted = false;
  let svg: d3.Selection<SVGSVGElement, undefined, null, undefined> | null =
    null;
  let resizeObserver: ResizeObserver | null = null;

  // Function to create the chart
  const createChart = (container: HTMLDivElement) => {
    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height) || 400; // fallback to 400px
    const width = size;
    const height = size;
    const margin = 1; // to avoid clipping the root circle stroke

    console.log("Creating chart with dimensions:", {
      width,
      height,
      containerRect,
    });

    // Specify the number format for values
    const format = d3.format(",d");

    // Create the pack layout
    const pack = d3
      .pack<NodeData>()
      .size([width - margin * 2, height - margin * 2])
      .padding(3);

    // Compute the hierarchy from the JSON data
    const root = pack(
      d3
        .hierarchy(data)
        .sum((d) => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
    );

    // Create the SVG container
    svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-margin, -margin, width, height])
      .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
      .attr("text-anchor", "middle");

    // Place each node according to the layout's x and y values
    const node = svg!
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

  // Initial render
  yield (
    <div class="w-full h-full flex items-center justify-center">
      <div
        ref={(el: HTMLDivElement | null) => {
          if (el && !chartMounted) {
            console.log("Ref callback called, mounting chart...");
            // Use setTimeout to ensure container has proper dimensions
            setTimeout(() => {
              if (!chartMounted) {
                el.innerHTML = "";
                const chartSvg = createChart(el);
                if (chartSvg) {
                  el.appendChild(chartSvg.node()!);
                  console.log("Chart mounted successfully");
                } else {
                  console.log("Failed to create chart");
                }
                chartMounted = true;
              }
            }, 0);

            // Set up resize observer for responsive behavior
            resizeObserver = new ResizeObserver((entries) => {
              for (const entry of entries) {
                const container = entry.target as HTMLDivElement;
                // Recreate chart with new dimensions
                container.innerHTML = "";
                const newChartSvg = createChart(container);
                if (newChartSvg) {
                  container.appendChild(newChartSvg.node()!);
                }
              }
            });
            resizeObserver.observe(el);
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
              console.log("Ref callback called (second), mounting chart...");
              // Use setTimeout to ensure container has proper dimensions
              setTimeout(() => {
                if (!chartMounted) {
                  el.innerHTML = "";
                  const chartSvg = createChart(el);
                  if (chartSvg) {
                    el.appendChild(chartSvg.node()!);
                    console.log("Chart mounted successfully (second)");
                  } else {
                    console.log("Failed to create chart (second)");
                  }
                  chartMounted = true;
                }
              }, 0);

              // Set up resize observer for responsive behavior
              resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                  const container = entry.target as HTMLDivElement;
                  // Recreate chart with new dimensions
                  container.innerHTML = "";
                  const newChartSvg = createChart(container);
                  if (newChartSvg) {
                    container.appendChild(newChartSvg.node()!);
                  }
                }
              });
              resizeObserver.observe(el);
            }
          }}
          class="w-full max-w-4xl h-auto"
          style="display: flex; justify-content: center; align-items: center;"
        />
      </div>
    );
  }

  // Cleanup on component unmount
  if (resizeObserver) {
    (resizeObserver as ResizeObserver).disconnect();
  }
}
