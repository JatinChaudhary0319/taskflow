import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Html5KanbanColumnDef<K extends string> = { id: K; title: string };

/** Props spread onto a drag handle (e.g. grip button). */
export type Html5KanbanDragHandleProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function insertIndexFromPointer(ul: HTMLElement, clientY: number): number {
  const nodes = [...ul.querySelectorAll<HTMLElement>("[data-kanban-item]")];
  if (nodes.length === 0) return 0;
  let index = nodes.length;
  for (let i = 0; i < nodes.length; i++) {
    const r = nodes[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) {
      index = i;
      break;
    }
  }
  return index;
}

function moveItem<K extends string, T extends { id: string }>(
  cols: Record<K, T[]>,
  fromCol: K,
  toCol: K,
  itemId: string,
  rawInsertIndex: number,
  mapMoved: (item: T, targetColumn: K) => T,
): Record<K, T[]> {
  const next = {} as Record<K, T[]>;
  (Object.keys(cols) as K[]).forEach((k) => {
    next[k] = [...cols[k]];
  });

  const fromList = next[fromCol];
  const fromIdx = fromList.findIndex((t) => t.id === itemId);
  if (fromIdx === -1) return cols;

  const [moved] = fromList.splice(fromIdx, 1);
  const updated = mapMoved(moved, toCol);
  const toList = next[toCol];
  let j = Math.min(Math.max(0, rawInsertIndex), toList.length);
  if (fromCol === toCol && fromIdx < j) {
    j -= 1;
  }
  if (fromCol === toCol && fromIdx === j) {
    toList.splice(j, 0, updated);
    return next;
  }
  toList.splice(j, 0, updated);
  return next;
}

export type Html5KanbanProps<T extends { id: string }, K extends string> = {
  columns: Html5KanbanColumnDef<K>[];
  value: Record<K, T[]>;
  onValueChange: (next: Record<K, T[]>) => void;
  /** Normalize column state after a move (e.g. re-index sort_order). */
  normalize?: (next: Record<K, T[]>) => Record<K, T[]>;
  mapMovedItem?: (item: T, targetColumn: K) => T;
  renderItem: (
    item: T,
    columnId: K,
    ctx: { dragHandleProps: Html5KanbanDragHandleProps; isDragging: boolean },
  ) => ReactNode;
  onDragSessionStart?: () => void;
  /** Drag ended without a successful drop (clear external snapshot, etc.). */
  onDragCancel?: () => void;
  /** Called after `onValueChange` when a drop completed; may be async. */
  onCommit?: (next: Record<K, T[]>) => void | Promise<void>;
  /** Blocks drag/drop while mutations run (e.g. reorder PATCH in flight). */
  interactionDisabled?: boolean;
  listClassName?: string;
  columnClassName?: string;
};

export function Html5Kanban<T extends { id: string }, K extends string>({
  columns,
  value,
  onValueChange,
  normalize = (x) => x,
  mapMovedItem,
  renderItem,
  onDragSessionStart,
  onDragCancel,
  onCommit,
  interactionDisabled = false,
  listClassName,
  columnClassName,
}: Html5KanbanProps<T, K>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const listRefs = useRef(new Map<K, HTMLUListElement | null>());
  const dropSucceededRef = useRef(false);

  const mapMoved = useCallback(
    (item: T, targetColumn: K) => (mapMovedItem ? mapMovedItem(item, targetColumn) : item),
    [mapMovedItem],
  );

  useEffect(() => {
    const onDragEndWindow = () => {
      setDraggingId(null);
      if (!dropSucceededRef.current) {
        onDragCancel?.();
      }
      dropSucceededRef.current = false;
    };
    window.addEventListener("dragend", onDragEndWindow);
    return () => window.removeEventListener("dragend", onDragEndWindow);
  }, [onDragCancel]);

  const handleListDragOver = (e: React.DragEvent) => {
    if (interactionDisabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleListDrop = (e: React.DragEvent, targetColumn: K) => {
    e.preventDefault();
    if (interactionDisabled) return;
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;

    let parsed: { id: string; fromColumn: K };
    try {
      parsed = JSON.parse(raw) as { id: string; fromColumn: K };
    } catch {
      return;
    }

    const ul = listRefs.current.get(targetColumn);
    const rawInsert = ul ? insertIndexFromPointer(ul, e.clientY) : value[targetColumn].length;

    dropSucceededRef.current = true;
    const moved = moveItem(value, parsed.fromColumn, targetColumn, parsed.id, rawInsert, mapMoved);
    const next = normalize(moved);
    onValueChange(next);
    if (onCommit) void Promise.resolve(onCommit(next));
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const items = value[col.id];
        return (
          <div key={col.id} className={cn("flex min-h-[220px] flex-col rounded-lg border bg-card/50 p-3", columnClassName)}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{col.title}</h2>
            <ul
              ref={(el) => {
                listRefs.current.set(col.id, el);
              }}
              className={cn("flex flex-1 flex-col gap-3", listClassName)}
              onDragOver={handleListDragOver}
              onDrop={(e) => handleListDrop(e, col.id)}
            >
              {items.map((item) => {
                const dragHandleProps: Html5KanbanDragHandleProps = {
                  type: "button",
                  draggable: !interactionDisabled,
                  onDragStart: (ev) => {
                    if (interactionDisabled) {
                      ev.preventDefault();
                      return;
                    }
                    ev.stopPropagation();
                    onDragSessionStart?.();
                    setDraggingId(item.id);
                    ev.dataTransfer.effectAllowed = "move";
                    ev.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ id: item.id, fromColumn: col.id }),
                    );
                  },
                };
                return (
                  <li key={item.id} data-kanban-item="" className="list-none">
                    {renderItem(item, col.id, {
                      dragHandleProps,
                      isDragging: draggingId === item.id,
                    })}
                  </li>
                );
              })}
              {items.length === 0 ? (
                <li className="flex flex-1 list-none items-center justify-center rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </li>
              ) : null}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
