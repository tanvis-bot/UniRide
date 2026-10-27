import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/http';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Small data-fetching hook: runs the request on mount (and whenever `deps`
 * change), tracks loading/error state and exposes a manual `refetch`.
 */
export function useAsync<T>(
fn: () => Promise<T>,
deps: unknown[] = [])
: AsyncState<T> & {refetch: () => void;setData: (value: T) => void;} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null
  });
  const mounted = useRef(true);
  const callback = useRef(fn);
  callback.current = fn;

  const run = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    callback.
    current().
    then((data) => {
      if (mounted.current) setState({ data, loading: false, error: null });
    }).
    catch((error) => {
      if (mounted.current)
      setState({ data: null, loading: false, error: errorMessage(error) });
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((value: T) => {
    setState({ data: value, loading: false, error: null });
  }, []);

  return { ...state, refetch: run, setData };
}