import type { NodeData } from "./Chart";

/**
 * Tree data manipulation operations
 */

export const addChildNode = (
  treeData: NodeData,
  targetPath: string[]
): NodeData | null => {
  console.log("Adding child node to path:", targetPath);

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

  // Deep clone the tree data to avoid mutations
  const newTreeData = JSON.parse(JSON.stringify(treeData));

  if (addToTree(newTreeData, targetPath)) {
    console.log("Successfully added child to tree");
    return newTreeData;
  } else {
    console.log("Failed to add child to tree");
    return null;
  }
};

export const renameNode = (
  treeData: NodeData,
  targetPath: string[],
  newName: string
): NodeData | null => {
  const renameInTree = (treeNode: NodeData, targetPath: string[]): boolean => {
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

  // Deep clone the tree data to avoid mutations
  const newTreeData = JSON.parse(JSON.stringify(treeData));

  if (renameInTree(newTreeData, targetPath)) {
    return newTreeData;
  }
  return null;
};

export const deleteNode = (
  treeData: NodeData,
  targetPath: string[]
): NodeData | null => {
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

  // Deep clone the tree data to avoid mutations
  const newTreeData = JSON.parse(JSON.stringify(treeData));

  if (deleteFromTree(newTreeData, targetPath)) {
    return newTreeData;
  }
  return null;
};
