import * as d3 from "d3";
import { loadTreeData, saveTreeData } from "./storage";
import type { Context } from "@b9g/crank";
import { addChildNode, renameNode, deleteNode } from "./treeOperations";
import { createChartRenderer, type ChartRenderer } from "./chartRenderer";
import { FloatingMenu, InlineEditor } from "./ChartUI";

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
  let chartRenderer: ChartRenderer | null = null;

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
  const handleAddChildNode = () => {
    if (!selectedNodePath) return;

    const newTreeData = addChildNode(treeData, selectedNodePath);
    if (newTreeData) {
      console.log("Saving tree data and refreshing...");
      treeData = newTreeData;
      saveTreeData(treeData);
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    } else {
      console.log("Failed to add child to tree");
    }
  };

  const handleRenameNode = (newName: string) => {
    if (!editingNode || editingNode === chartRenderer?.zoomManager.currentFocus)
      return;

    const path = editingNode
      .ancestors()
      .map((d) => d.data.name)
      .reverse();

    const newTreeData = renameNode(treeData, path, newName);
    if (newTreeData) {
      treeData = newTreeData;
      saveTreeData(treeData);
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    }
  };

  const handleDeleteNode = (node: d3.HierarchyCircularNode<NodeData>) => {
    if (node === chartRenderer?.zoomManager.currentFocus) return; // Don't delete root

    const path = node
      .ancestors()
      .map((d) => d.data.name)
      .reverse();

    const newTreeData = deleteNode(treeData, path);
    if (newTreeData) {
      treeData = newTreeData;
      saveTreeData(treeData);
      selectedNode = null;
      menuPosition = null;
      selectedNodePath = null;
      // Increment chart key to force recreation
      chartKey++;
      refresh();
    }
  };

  // Event handlers for chart interactions
  const handleNodeClick = (
    event: MouseEvent,
    d: d3.HierarchyCircularNode<NodeData>
  ) => {
    event.stopPropagation();
    selectedNode = selectedNode === d ? null : d;

    // Calculate menu position and store node path
    if (selectedNode && chartRenderer) {
      const rect = (event.target as Element).getBoundingClientRect();
      const svgRect = chartRenderer.svg.node()!.getBoundingClientRect();
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

    // Update selection state
    if (chartRenderer) {
      chartRenderer.updateSelection(selectedNode, hoveredNode);
    }

    // Trigger refresh through the context
    setTimeout(refresh, 0);
  };

  const handleNodeDoubleClick = (
    event: MouseEvent,
    d: d3.HierarchyCircularNode<NodeData>
  ) => {
    event.stopPropagation();
    // Allow zooming into any node (including leaf nodes)
    selectedNode = null;
    hoveredNode = null;
    if (chartRenderer) {
      chartRenderer.zoomManager.zoomTo(d);
    }
  };

  const handleSvgClick = () => {
    // Only zoom out if we're not at the root level and click wasn't on a circle
    if (chartRenderer && chartRenderer.zoomManager.currentFocus) {
      const { currentFocus, zoomTo } = chartRenderer.zoomManager;
      if (currentFocus && currentFocus.parent) {
        selectedNode = null;
        hoveredNode = null;
        zoomTo(currentFocus.parent);
      }
    }
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
      } else if (chartRenderer?.zoomManager.zoomToRoot) {
        chartRenderer.zoomManager.zoomToRoot();
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

              // Clean up previous renderer
              if (chartRenderer) {
                chartRenderer.destroy();
              }

              // Create new chart renderer
              chartRenderer = createChartRenderer(
                treeData,
                width,
                height,
                handleNodeClick,
                handleNodeDoubleClick,
                handleSvgClick
              );

              el.appendChild(chartRenderer.svg.node()!);
              window.addEventListener("keydown", handleKeyDown);
            }
          }}
          class="w-full h-full flex items-center justify-center"
        />

        {/* Floating Action Menu */}
        <FloatingMenu
          selectedNode={selectedNode}
          menuPosition={menuPosition}
          currentFocus={
            (chartRenderer as ChartRenderer | null)?.zoomManager.currentFocus ??
            null
          }
          onAddChild={() => {
            handleAddChildNode();
            selectedNode = null;
            menuPosition = null;
            selectedNodePath = null;
          }}
          onRename={() => {
            isEditingName = true;
            editingNode = selectedNode;
          }}
          onDelete={() => handleDeleteNode(selectedNode!)}
        />

        {/* Inline Name Editor */}
        <InlineEditor
          isEditingName={isEditingName}
          editingNode={editingNode}
          menuPosition={menuPosition}
          onRename={(newName) => {
            handleRenameNode(newName);
            isEditingName = false;
            editingNode = null;
          }}
          onCancel={() => {
            isEditingName = false;
            editingNode = null;
          }}
        />
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
