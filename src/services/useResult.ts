"use client";

import { useEffect, useState } from "react";
import type { Result } from "./result";

/** Runs `load` on mount and whenever `deps` change. Undefined while loading. */
export function useResult<T>(load: () => Promise<Result<T>>, deps: readonly unknown[]): Result<T> | undefined {
  const key = JSON.stringify(deps);
  const [got, setGot] = useState<{ key: string; result: Result<T> }>();
  useEffect(() => {
    let live = true;
    load().then((result) => live && setGot({ key, result }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for the caller's deps
  }, [key]);
  return got?.key === key ? got.result : undefined;
}
