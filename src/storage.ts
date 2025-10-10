import type { NodeData } from "./Chart";

const STORAGE_KEY = "tree-data";

const DEFAULT_ROOT: NodeData = {
  name: "Root",
  value: 1,
  children: [],
};

// Ensure all nodes have values for D3 circle packing
function ensureNodeValues(node: NodeData): NodeData {
  if (node.value === undefined || node.value === null) {
    node.value = 1;
  }
  if (node.children) {
    node.children = node.children.map(ensureNodeValues);
  }
  return node;
}

export function loadTreeData(): NodeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as NodeData;
      return ensureNodeValues(data);
    }
  } catch (error) {
    console.error("Failed to load tree data from localStorage:", error);
  }
  return DEFAULT_ROOT;
}

export function saveTreeData(data: NodeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save tree data to localStorage:", error);
  }
}
