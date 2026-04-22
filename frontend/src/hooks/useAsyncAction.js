import { useCallback, useState } from "react";
import { toast } from "sonner";
const getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
export function useAsyncAction() {
  const [isRunning, setIsRunning] = useState(false);
  const run = useCallback(async (action, options) => {
    setIsRunning(true);
    try {
      const result = await action();
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      toast.error(getErrorMessage(error, options?.errorMessage ?? "操作失败"));
      options?.onError?.(error);
      return undefined;
    } finally {
      setIsRunning(false);
    }
  }, []);
  return {
    isRunning,
    run,
  };
}
