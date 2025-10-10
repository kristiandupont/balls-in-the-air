import * as d3 from "d3";
import type { NodeData } from "./Chart";

export type ViewState = [number, number, number] | null; // [x, y, k]

export interface ZoomManager {
  view: ViewState;
  currentFocus: d3.HierarchyCircularNode<NodeData> | null;
  zoomTo: (target: d3.HierarchyCircularNode<NodeData>) => void;
  zoomToRoot: () => void;
  isDescendantOf: (
    descendant: d3.HierarchyCircularNode<NodeData>,
    ancestor: d3.HierarchyCircularNode<NodeData>
  ) => boolean;
}

export const createZoomManager = (
  chartWidth: number,
  chartHeight: number,
  margin: number,
  root: d3.HierarchyCircularNode<NodeData>,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoomLayer: d3.Selection<SVGGElement, unknown, null, undefined>,
  node: d3.Selection<
    SVGGElement,
    d3.HierarchyCircularNode<NodeData>,
    SVGGElement,
    unknown
  >,
  text: d3.Selection<
    SVGTextElement,
    d3.HierarchyCircularNode<NodeData>,
    SVGGElement,
    unknown
  >
): ZoomManager => {
  let view: ViewState = [chartWidth / 2, chartHeight / 2, 1];
  let currentFocus: d3.HierarchyCircularNode<NodeData> | null = root;

  const isDescendantOf = (
    descendant: d3.HierarchyCircularNode<NodeData>,
    ancestor: d3.HierarchyCircularNode<NodeData>
  ): boolean => {
    if (descendant === ancestor) return true;
    return descendant.ancestors().indexOf(ancestor) !== -1;
  };

  const updateLabelVisibility = (k: number) => {
    const minPixelRadius = 10; // threshold similar to original r>10 logic
    text.style("display", (d) => (d.r * k > minPixelRadius ? null : "none"));
  };

  const zoomTo = (target: d3.HierarchyCircularNode<NodeData>) => {
    if (!view) view = [chartWidth / 2, chartHeight / 2, 1];

    // Target scale so that target circle fits viewport
    const kTarget =
      Math.min(chartWidth, chartHeight) / (target.r * 2 + margin * 2);
    const xTarget = target.x;
    const yTarget = target.y;

    const interp = d3.interpolate(view, [xTarget, yTarget, kTarget]);

    // Fade non-descendants, enable descendants
    node
      .interrupt()
      .transition()
      .duration(250)
      .style("opacity", (d) => (isDescendantOf(d, target) ? 1 : 0))
      .style("pointer-events", (d) =>
        isDescendantOf(d, target) ? "auto" : "none"
      );

    const t = svg
      .interrupt()
      .transition()
      .duration(700)
      .ease(d3.easeCubicInOut);

    t.tween("zoom", () => {
      return (tt: number) => {
        const [xv, yv, kv] = interp(tt);
        const transform = `translate(${chartWidth / 2},${
          chartHeight / 2
        }) scale(${kv}) translate(${-xv},${-yv})`;
        zoomLayer.attr("transform", transform);
        // Counter-scale text to keep readable size
        zoomLayer.selectAll("text").style("font-size", `${10 / kv}px`);
        // Keep strokes constant
        zoomLayer
          .selectAll("circle")
          .attr("vector-effect", "non-scaling-stroke");
        // Update visibility based on zoom level
        updateLabelVisibility(kv);
      };
    }).on("end", () => {
      view = [xTarget, yTarget, kTarget];
      currentFocus = target;
    });
  };

  const zoomToRoot = () => {
    if (currentFocus && currentFocus !== root) {
      zoomTo(root);
    }
  };

  // Apply initial transform
  const [x0, y0, k0] = view;
  const initialTransform = `translate(${chartWidth / 2},${
    chartHeight / 2
  }) scale(${k0}) translate(${-x0},${-y0})`;
  zoomLayer.attr("transform", initialTransform);
  updateLabelVisibility(k0);

  return {
    view,
    currentFocus,
    zoomTo,
    zoomToRoot,
    isDescendantOf,
  };
};
