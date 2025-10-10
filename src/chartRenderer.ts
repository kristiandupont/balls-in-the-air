import * as d3 from "d3";
import type { NodeData } from "./Chart";
import { createZoomManager, type ZoomManager } from "./zoomManager";

export interface ChartRenderer {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  zoomManager: ZoomManager;
  updateSelection: (
    selectedNode: d3.HierarchyCircularNode<NodeData> | null,
    hoveredNode: d3.HierarchyCircularNode<NodeData> | null
  ) => void;
  destroy: () => void;
}

export const createChartRenderer = (
  treeData: NodeData,
  width: number,
  height: number,
  onNodeClick: (
    event: MouseEvent,
    node: d3.HierarchyCircularNode<NodeData>
  ) => void,
  onNodeDoubleClick: (
    event: MouseEvent,
    node: d3.HierarchyCircularNode<NodeData>
  ) => void,
  onSvgClick: (event: MouseEvent) => void
): ChartRenderer => {
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

  // Compute the hierarchy from the tree data
  const hierarchyRoot = d3
    .hierarchy(treeData)
    .sum((d) => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const root = pack(hierarchyRoot);

  // Create the SVG container
  const svg = d3
    .create("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("viewBox", [-margin, -margin, chartWidth, chartHeight])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .attr("text-anchor", "middle");

  // Container used for zooming (scale/translate)
  const zoomLayer = svg.append("g");

  // Place each node according to the layout's x and y values
  const node = zoomLayer
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
  const circles = node
    .append("circle")
    .attr("fill", (d) => (d.children ? "#fff" : "#ddd"))
    .attr("stroke", (d) => (d.children ? "#bbb" : null))
    .attr("stroke-width", 1)
    .attr("r", (d) => d.r)
    .style("cursor", "pointer")
    .on("click", onNodeClick)
    .on("dblclick", onNodeDoubleClick);

  // Add labels to all nodes; we'll control visibility based on zoom/size
  const text = node
    .append("text")
    .attr("clip-path", (d) => `circle(${d.r})`)
    .style("pointer-events", "none");

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

  // Create zoom manager
  const zoomManager = createZoomManager(
    chartWidth,
    chartHeight,
    margin,
    root,
    svg as d3.Selection<SVGSVGElement, unknown, null, undefined>,
    zoomLayer as d3.Selection<SVGGElement, unknown, null, undefined>,
    node as d3.Selection<
      SVGGElement,
      d3.HierarchyCircularNode<NodeData>,
      SVGGElement,
      unknown
    >,
    text as d3.Selection<
      SVGTextElement,
      d3.HierarchyCircularNode<NodeData>,
      SVGGElement,
      unknown
    >
  );

  // Add click-outside-to-zoom-out functionality
  (svg as d3.Selection<SVGSVGElement, unknown, null, undefined>).on(
    "click",
    onSvgClick
  );

  const updateSelection = (
    selectedNode: d3.HierarchyCircularNode<NodeData> | null,
    hoveredNode: d3.HierarchyCircularNode<NodeData> | null
  ) => {
    circles
      .transition()
      .duration(200)
      .attr("fill", (d) => {
        if (selectedNode === d) return "#4f46e5"; // selected: indigo
        if (hoveredNode === d) return "#f59e0b"; // hovered: amber
        return d.children ? "#fff" : "#ddd"; // default
      })
      .attr("stroke", (d) => {
        if (selectedNode === d) return "#3730a3"; // selected: darker indigo
        if (hoveredNode === d) return "#d97706"; // hovered: darker amber
        return d.children ? "#bbb" : null; // default
      })
      .attr("stroke-width", (d) => {
        if (selectedNode === d || hoveredNode === d) return 3;
        return 1;
      });
  };

  const destroy = () => {
    svg.remove();
  };

  return {
    svg: svg as d3.Selection<SVGSVGElement, unknown, null, undefined>,
    zoomManager,
    updateSelection,
    destroy,
  };
};
