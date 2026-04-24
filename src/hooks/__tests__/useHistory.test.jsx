import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useHistory } from "../useHistory.js";

const makeSnapshot = (id) => ({
  nodes: [{ id: `node-${id}` }],
  edges: [{ id: `edge-${id}` }],
});

const flushHistoryPush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("useHistory", () => {
  it("tracks undo and redo stacks in order", async () => {
    const { result } = renderHook(() => useHistory());
    const first = makeSnapshot("first");
    const second = makeSnapshot("second");
    const latest = makeSnapshot("latest");
    const restore = vi.fn();

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.pushHistory(first);
    });
    await flushHistoryPush();

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.pushHistory(second);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });

    expect(restore).toHaveBeenLastCalledWith(second);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.undo(second, restore);
    });

    expect(restore).toHaveBeenLastCalledWith(first);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo(first, restore);
    });

    expect(restore).toHaveBeenLastCalledWith(second);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo(second, restore);
    });

    expect(restore).toHaveBeenLastCalledWith(latest);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("clears redo history when a new snapshot is pushed after undo", async () => {
    const { result } = renderHook(() => useHistory());
    const first = makeSnapshot("first");
    const latest = makeSnapshot("latest");
    const branched = makeSnapshot("branched");
    const restore = vi.fn();

    act(() => {
      result.current.pushHistory(first);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });

    expect(restore).toHaveBeenLastCalledWith(first);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.pushHistory(branched);
    });
    await flushHistoryPush();

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    restore.mockClear();
    act(() => {
      result.current.redo(branched, restore);
    });

    expect(restore).not.toHaveBeenCalled();
  });

  it("enforces the configured history limit", async () => {
    const { result } = renderHook(() => useHistory({ limit: 2 }));
    const first = makeSnapshot("first");
    const second = makeSnapshot("second");
    const third = makeSnapshot("third");
    const latest = makeSnapshot("latest");
    const restore = vi.fn();

    act(() => {
      result.current.pushHistory(first);
    });
    await flushHistoryPush();

    act(() => {
      result.current.pushHistory(second);
    });
    await flushHistoryPush();

    act(() => {
      result.current.pushHistory(third);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });
    expect(restore).toHaveBeenLastCalledWith(third);

    act(() => {
      result.current.undo(third, restore);
    });
    expect(restore).toHaveBeenLastCalledWith(second);
    expect(result.current.canUndo).toBe(false);

    restore.mockClear();
    act(() => {
      result.current.undo(second, restore);
    });

    expect(restore).not.toHaveBeenCalled();
  });

  it("coalesces synchronous pushes until the pending push is flushed", async () => {
    const { result } = renderHook(() => useHistory());
    const first = makeSnapshot("first");
    const ignored = makeSnapshot("ignored");
    const later = makeSnapshot("later");
    const latest = makeSnapshot("latest");
    const restore = vi.fn();

    act(() => {
      result.current.pushHistory(first);
      result.current.pushHistory(ignored);
    });
    await flushHistoryPush();

    act(() => {
      result.current.pushHistory(later);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });
    expect(restore).toHaveBeenLastCalledWith(later);

    act(() => {
      result.current.undo(later, restore);
    });
    expect(restore).toHaveBeenLastCalledWith(first);
    expect(result.current.canUndo).toBe(false);
  });

  it("does not push history while a snapshot is being restored", async () => {
    const { result } = renderHook(() => useHistory());
    const first = makeSnapshot("first");
    const latest = makeSnapshot("latest");
    const duringRestore = makeSnapshot("during-restore");
    const restore = vi.fn((target) => {
      result.current.pushHistory(duringRestore);
      return target;
    });

    act(() => {
      result.current.pushHistory(first);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });
    await flushHistoryPush();

    expect(restore).toHaveBeenLastCalledWith(first);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("clears undo and redo history", async () => {
    const { result } = renderHook(() => useHistory());
    const first = makeSnapshot("first");
    const latest = makeSnapshot("latest");
    const restore = vi.fn();

    act(() => {
      result.current.pushHistory(first);
    });
    await flushHistoryPush();

    act(() => {
      result.current.undo(latest, restore);
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    restore.mockClear();
    act(() => {
      result.current.undo(first, restore);
      result.current.redo(first, restore);
    });

    expect(restore).not.toHaveBeenCalled();
  });
});
