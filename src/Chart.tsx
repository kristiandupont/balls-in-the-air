import * as d3 from "d3";
import { loadTreeData, saveTreeData } from "./storage";
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
  let selectedNode: d3.HierarchyCircularNode<NodeData> | null = null;
  let hoveredNode: d3.HierarchyCircularNode<NodeData> | null = null;
  // Smooth zoom state (transform-based)
  let view: [number, number, number] | null = null; // [x, y, k]
  let currentFocus: d3.HierarchyCircularNode<NodeData> | null = null;
  let zoomToRoot: (() => void) | null = null;

  // Tree data state
  let treeData: NodeData = loadTreeData();
  let menuPosition: { x: number; y: number } | null = null;
  let isEditingName = false;
  let editingNode: d3.HierarchyCircularNode<NodeData> | null = null;
  let selectedNodePath: string[] | null = null;
  let chartKey = 0; // Key to force chart recreation

  // Store refresh function for use in event handlers
  const refresh = () => {
    console.log("Refreshing component, chartKey will be:", chartKey);
    this.refresh();
  };

  // Data manipulation functions
  const addChildNode = () => {
    if (!selectedNodePath) return;

    console.log("Adding child node to path:", selectedNodePath);

    // Find the parent in the tree data and add the new child
    const addToTree = (node: NodeData, targetPath: string[]): boolean => {
      if (targetPath.length === 1 && node.name === targetPath[0]) {
        // We found the target node, add the child here
        if (!node.children) node.children = [];
        // Create new node with value that's 1/10th of parent's value
        const parentValue = node.value || 1;
        const newNode: NodeData = {
          name: "New Node",
          value: parentValue / 10,
          children: [],
        };
        node.children.push(newNode);
        console.log(
          "Added child to node:",
          node.name,
          "with value:",
          newNode.value,
          "children count:",
          node.children.length
        );
        return true;
      }

      if (node.children) {
        for (const child of node.children) {
          if (addToTree(child, targetPath.slice(1))) {
            return true;
          }
        }
      }
      return false;
    };

    if (addToTree(treeData, selectedNodePath)) {
      console.log("Saving tree data and refreshing...");
      saveTreeData(treeData);
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    } else {
      console.log("Failed to add child to tree");
    }
  };

  const renameNode = (
    node: d3.HierarchyCircularNode<NodeData>,
    newName: string
  ) => {
    if (node === currentFocus) return; // Don't rename root

    const renameInTree = (
      treeNode: NodeData,
      targetPath: string[]
    ): boolean => {
      if (targetPath.length === 1) {
        treeNode.name = newName;
        return true;
      }

      if (treeNode.children) {
        for (const child of treeNode.children) {
          if (renameInTree(child, targetPath.slice(1))) {
            return true;
          }
        }
      }
      return false;
    };

    const path = node
      .ancestors()
      .map((d) => d.data.name)
      .reverse();
    if (renameInTree(treeData, path)) {
      saveTreeData(treeData);
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    }
  };

  const deleteNode = (node: d3.HierarchyCircularNode<NodeData>) => {
    if (node === currentFocus) return; // Don't delete root

    const deleteFromTree = (
      treeNode: NodeData,
      targetPath: string[]
    ): boolean => {
      if (targetPath.length === 2 && treeNode.children) {
        const targetName = targetPath[1];
        const index = treeNode.children.findIndex(
          (child) => child.name === targetName
        );
        if (index !== -1) {
          treeNode.children.splice(index, 1);
          return true;
        }
      }

      if (treeNode.children) {
        for (const child of treeNode.children) {
          if (deleteFromTree(child, targetPath.slice(1))) {
            return true;
          }
        }
      }
      return false;
    };

    const path = node
      .ancestors()
      .map((d) => d.data.name)
      .reverse();
    if (deleteFromTree(treeData, path)) {
      saveTreeData(treeData);
      selectedNode = null;
      menuPosition = null;
      selectedNodePath = null;
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    }
  };

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

    // Compute the hierarchy from the tree data
    const hierarchyRoot = d3
      .hierarchy(treeData)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const root = pack(hierarchyRoot);
    if (!currentFocus) currentFocus = root;

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
      })
      .attr("r", (d) => d.r)
      .style("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        hoveredNode = d;
        // Update only the hovered circle
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill", "#f59e0b")
          .attr("stroke", "#d97706")
          .attr("stroke-width", 3);
      })
      .on("mouseleave", function (_, d) {
        hoveredNode = null;
        // Update only the circle that's no longer hovered
        d3.select(this)
          .transition()
          .duration(150)
          .attr(
            "fill",
            selectedNode === d ? "#4f46e5" : d.children ? "#fff" : "#ddd"
          )
          .attr(
            "stroke",
            selectedNode === d ? "#3730a3" : d.children ? "#bbb" : null
          )
          .attr("stroke-width", selectedNode === d ? 3 : 1);
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        selectedNode = selectedNode === d ? null : d;

        // Calculate menu position and store node path
        if (selectedNode) {
          const rect = this.getBoundingClientRect();
          const svgRect = svg.node()!.getBoundingClientRect();
          menuPosition = {
            x: d.x + svgRect.left - rect.left,
            y: d.y + svgRect.top - rect.top,
          };
          selectedNodePath = d
            .ancestors()
            .map((ancestor) => ancestor.data.name)
            .reverse();
        } else {
          menuPosition = null;
          selectedNodePath = null;
        }

        // Update all circles to reflect new selection state
        circles
          .transition()
          .duration(200)
          .attr("fill", (nodeData) => {
            if (selectedNode === nodeData) return "#4f46e5";
            if (hoveredNode === nodeData) return "#f59e0b";
            return nodeData.children ? "#fff" : "#ddd";
          })
          .attr("stroke", (nodeData) => {
            if (selectedNode === nodeData) return "#3730a3";
            if (hoveredNode === nodeData) return "#d97706";
            return nodeData.children ? "#bbb" : null;
          })
          .attr("stroke-width", (nodeData) => {
            if (selectedNode === nodeData || hoveredNode === nodeData) return 3;
            return 1;
          });

        // Trigger refresh through the context
        setTimeout(refresh, 0);
      });

    // Initialize transform-based zoom state
    view = view ?? [chartWidth / 2, chartHeight / 2, 1];

    const isDescendantOf = (
      descendant: d3.HierarchyCircularNode<NodeData>,
      ancestor: d3.HierarchyCircularNode<NodeData>
    ): boolean => {
      if (descendant === ancestor) return true;
      return descendant.ancestors().indexOf(ancestor) !== -1;
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

    // Attach double-click zoom
    circles.on("dblclick", function (event, d) {
      event.stopPropagation();
      // Allow zooming into any node (including leaf nodes)
      selectedNode = null;
      hoveredNode = null;
      zoomTo(d);
    });

    // Add click-outside-to-zoom-out functionality
    svg.on("click", function () {
      // Only zoom out if we're not at the root level and click wasn't on a circle
      if (currentFocus && currentFocus !== root && currentFocus.parent) {
        selectedNode = null;
        hoveredNode = null;
        zoomTo(currentFocus.parent);
      }
    });

    // Expose a way to zoom back to root for Escape key handler
    zoomToRoot = () => {
      if (currentFocus && currentFocus !== root) {
        zoomTo(root);
      }
    };

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

    // Helper: show labels only when on-screen radius exceeds threshold
    const updateLabelVisibility = (k: number) => {
      const minPixelRadius = 10; // threshold similar to original r>10 logic
      text.style("display", (d) => (d.r * k > minPixelRadius ? null : "none"));
    };

    // Apply initial transform
    const [x0, y0, k0] = view;
    const initialTransform = `translate(${chartWidth / 2},${
      chartHeight / 2
    }) scale(${k0}) translate(${-x0},${-y0})`;
    zoomLayer.attr("transform", initialTransform);
    updateLabelVisibility(k0);

    return svg;
  };

  // Keyboard handler for Escape to reset zoom and close menu
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (isEditingName) {
        isEditingName = false;
        editingNode = null;
        refresh();
      } else if (selectedNode) {
        selectedNode = null;
        menuPosition = null;
        selectedNodePath = null;
        refresh();
      } else if (zoomToRoot) {
        zoomToRoot();
      }
    }
  };

  for (const _ of this) {
    yield (
      <div class="w-full h-full flex items-center justify-center relative">
        <div
          key={chartKey}
          data-chart-host="circle-pack"
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              console.log("Creating chart, chartKey:", chartKey);
              el.innerHTML = "";
              // Reload tree data in case it was updated
              treeData = loadTreeData();
              console.log("Loaded tree data:", treeData);
              const chartSvg = createChart();
              el.appendChild(chartSvg.node()!);
              window.addEventListener("keydown", handleKeyDown);
            }
          }}
          class="w-full h-full flex items-center justify-center"
        />

        {/* Floating Action Menu */}
        {selectedNode && menuPosition && !isEditingName && (
          <div
            class="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
            style={`left: ${
              (menuPosition as { x: number; y: number }).x + 20
            }px; top: ${(menuPosition as { x: number; y: number }).y - 20}px;`}
          >
            <div class="flex flex-col gap-1">
              <button
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onclick={() => {
                  addChildNode();
                  selectedNode = null;
                  menuPosition = null;
                  selectedNodePath = null;
                }}
              >
                Add Child
              </button>
              {selectedNode !== currentFocus && (
                <>
                  <button
                    class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    onclick={() => {
                      isEditingName = true;
                      editingNode = selectedNode;
                    }}
                  >
                    Rename
                  </button>
                  <button
                    class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    onclick={() => deleteNode(selectedNode!)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Inline Name Editor */}
        {isEditingName && editingNode && menuPosition && (
          <div
            class="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
            style={`left: ${
              (menuPosition as { x: number; y: number }).x
            }px; top: ${(menuPosition as { x: number; y: number }).y + 20}px;`}
          >
            <input
              type="text"
              value={
                (editingNode as d3.HierarchyCircularNode<NodeData>).data.name
              }
              class="px-2 py-1 border border-gray-300 rounded text-sm"
              onkeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  renameNode(
                    editingNode as d3.HierarchyCircularNode<NodeData>,
                    target.value
                  );
                  isEditingName = false;
                  editingNode = null;
                } else if (e.key === "Escape") {
                  isEditingName = false;
                  editingNode = null;
                }
              }}
              onblur={(e: FocusEvent) => {
                const target = e.target as HTMLInputElement;
                renameNode(
                  editingNode as d3.HierarchyCircularNode<NodeData>,
                  target.value
                );
                isEditingName = false;
                editingNode = null;
              }}
              autofocus
            />
          </div>
        )}
      </div>
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
