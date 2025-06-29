/**
 * Database timeout utilities for preventing stuck loading states
 */

/**
 * Helper function to safely format error objects for logging
 */
export const formatError = (error: unknown): string => {
  if (!error) {
    return 'Unknown error (null or undefined)';
  }
  
  if (error instanceof Error) {
    return error.message || error.toString();
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object') {
    // Check if it's an empty object
    if (Object.keys(error).length === 0) {
      return 'Empty error object';
    }
    
    // Try to get meaningful info from the object
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as any).error;
    }
    
    // Last resort - stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'Complex error object (could not stringify)';
    }
  }
  
  return `Unknown error type: ${typeof error}`;
};

export interface TimeoutOptions {
  timeoutMs?: number;
  operation?: string;
}

/**
 * Wraps a database operation with a timeout to prevent indefinite loading states
 */
export const withTimeout = async <T>(
  operation: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> => {
  const { timeoutMs = 8000, operation: operationName = 'Database operation' } = options;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    console.warn(`${operationName} failed:`, {
      error: formatError(error),
      errorType: error instanceof Error ? 'Error' : typeof error,
      timeout: timeoutMs,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Wraps multiple database operations to run in parallel with timeout
 */
export const withParallelTimeout = async <T extends Record<string, Promise<any>>>(
  operations: T,
  options: TimeoutOptions = {}
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> => {
  const { timeoutMs = 8000 } = options;
  
  const wrappedOperations = Object.entries(operations).map(async ([key, promise]) => {
    try {
      const result = await withTimeout(promise, { 
        timeoutMs, 
        operation: `${String(key)} operation` 
      });
      return [key, result];
    } catch (error) {
      console.warn(`Operation ${String(key)} failed:`, formatError(error));
      return [key, null]; // Return null for failed operations
    }
  });

  const results = await Promise.all(wrappedOperations);
  
  return results.reduce((acc, [key, value]) => {
    acc[key as keyof T] = value;
    return acc;
  }, {} as { [K in keyof T]: Awaited<T[K]> | null });
};

/**
 * Safely executes a database operation with proper error handling and timeout
 */
export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  options: TimeoutOptions = {}
): Promise<T> => {
  try {
    return await withTimeout(operation(), options);
  } catch (error) {
    console.warn(`Safe database operation failed, returning fallback:`, {
      operation: options.operation || 'Unknown operation',
      error: formatError(error),
      errorType: error instanceof Error ? 'Error' : typeof error,
      fallback: fallbackValue
    });
    return fallbackValue;
  }
};