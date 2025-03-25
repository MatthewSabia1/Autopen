/**
 * Debugging utility functions
 */

/**
 * Logs detailed error information to the console in development environments
 * @param location - Where the error occurred (e.g., 'WorkflowContext.createProject')
 * @param error - The error object
 * @param additionalInfo - Any additional context
 */
export const logError = (location: string, error: any, additionalInfo?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.group(`🐞 Error in ${location}`);
    console.error('Error message:', error?.message || 'Unknown error');
    
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    if (error?.cause) {
      console.error('Cause:', error.cause);
    }
    
    if (additionalInfo) {
      console.log('Additional context:', additionalInfo);
    }
    
    console.groupEnd();
  }
};

/**
 * Logs Supabase operation details in development environments
 * @param operation - The Supabase operation being performed
 * @param details - Details about the operation
 */
export const logSupabaseOperation = (operation: string, details: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.group(`📡 Supabase operation: ${operation}`);
    console.log('Details:', details);
    console.groupEnd();
  }
};
