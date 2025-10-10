import type { Context } from "@b9g/crank";
import * as d3 from "d3";
import type { NodeData } from "./Chart";

interface FloatingMenuProps {
  selectedNode: d3.HierarchyCircularNode<NodeData> | null;
  menuPosition: { x: number; y: number } | null;
  currentFocus: d3.HierarchyCircularNode<NodeData> | null;
  onAddChild: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function* FloatingMenu(
  this: Context,
  {
    selectedNode,
    menuPosition,
    currentFocus,
    onAddChild,
    onRename,
    onDelete,
  }: FloatingMenuProps
) {
  for (const _ of this) {
    if (!selectedNode || !menuPosition) {
      return null;
    }

    yield (
      <div
        class="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
        style={`left: ${menuPosition.x + 20}px; top: ${menuPosition.y - 20}px;`}
      >
        <div class="flex flex-col gap-1">
          <button
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onclick={onAddChild}
          >
            Add Child
          </button>
          {selectedNode !== currentFocus && (
            <>
              <button
                class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                onclick={onRename}
              >
                Rename
              </button>
              <button
                class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                onclick={onDelete}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}

interface InlineEditorProps {
  isEditingName: boolean;
  editingNode: d3.HierarchyCircularNode<NodeData> | null;
  menuPosition: { x: number; y: number } | null;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export function* InlineEditor(
  this: Context,
  {
    isEditingName,
    editingNode,
    menuPosition,
    onRename,
    onCancel,
  }: InlineEditorProps
) {
  for (const _ of this) {
    if (!isEditingName || !editingNode || !menuPosition) {
      return null;
    }

    yield (
      <div
        class="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
        style={`left: ${menuPosition.x}px; top: ${menuPosition.y + 20}px;`}
      >
        <input
          type="text"
          value={editingNode.data.name}
          class="px-2 py-1 border border-gray-300 rounded text-sm"
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLInputElement;
              onRename(target.value);
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          onblur={(e: FocusEvent) => {
            const target = e.target as HTMLInputElement;
            onRename(target.value);
          }}
          autofocus
        />
      </div>
    );
  }
}
