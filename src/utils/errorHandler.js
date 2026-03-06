/**
 * Error handling utilities for user-friendly error messages
 */

const ERROR_MESSAGES = {
  // API errors
  'No API key found': {
    title: 'API Key Missing',
    message: 'No API key configured. Please add your API key to the .env file (VITE_OPENROUTER_API_KEY, VITE_GEMINI_API_KEY, or VITE_ANTHROPIC_API_KEY).'
  },
  'Failed to analyze drawing': {
    title: 'Analysis Failed',
    message: 'The AI service could not analyze this drawing. Please try again or use a different file format.'
  },
  'No response content': {
    title: 'Empty Response',
    message: 'The AI service returned an empty response. Please try again.'
  },
  'No instruments found': {
    title: 'No Instruments Detected',
    message: 'No instruments or equipment were found in the drawing. Make sure the file is a valid P&ID drawing.'
  },
  'No instruments detected': {
    title: 'No Instruments Detected',
    message: 'No instruments or equipment were found in the drawing. Make sure the file is a valid P&ID drawing.'
  },
  'No valid instruments': {
    title: 'Validation Failed',
    message: 'Instruments were detected but none passed validation. The drawing may not match the expected format.'
  },
  'No JSON array found': {
    title: 'Parse Error',
    message: 'The AI response could not be parsed. Please try again.'
  },
  'Failed to parse instrument data': {
    title: 'Parse Error',
    message: 'Could not extract instrument data from the AI response. Please try again.'
  },

  // Network errors
  'Failed to fetch': {
    title: 'Network Error',
    message: 'Could not connect to the AI service. Check your internet connection and try again.'
  },
  'NetworkError': {
    title: 'Network Error',
    message: 'A network error occurred. Check your internet connection and try again.'
  },
  'timeout': {
    title: 'Request Timeout',
    message: 'The request took too long. The file may be too large or the service may be busy. Try again.'
  },

  // Auth errors
  '401': {
    title: 'Authentication Error',
    message: 'Your API key is invalid or expired. Please check your .env file.'
  },
  '403': {
    title: 'Access Denied',
    message: 'Your API key does not have permission for this operation. Check your API plan.'
  },
  '429': {
    title: 'Rate Limited',
    message: 'Too many requests. Please wait a moment and try again.'
  },
  '500': {
    title: 'Server Error',
    message: 'The AI service encountered an error. Please try again in a few moments.'
  },
  '503': {
    title: 'Service Unavailable',
    message: 'The AI service is temporarily unavailable. Please try again later.'
  },

  // File errors
  'File too large': {
    title: 'File Too Large',
    message: 'The file exceeds the 10MB size limit. Please use a smaller file or compress it.'
  },
  'Invalid file type': {
    title: 'Invalid File Type',
    message: 'Only PDF, PNG, and JPG files are supported.'
  },
  'File is empty': {
    title: 'Empty File',
    message: 'The selected file is empty. Please choose a different file.'
  }
};

/**
 * Convert a raw error into a user-friendly error object
 */
export function getUserFriendlyError(error) {
  const errorMessage = error?.message || String(error);

  // Check against known error patterns
  for (const [pattern, friendly] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(pattern)) {
      return {
        title: friendly.title,
        message: friendly.message,
        technicalDetails: errorMessage
      };
    }
  }

  // Default fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    technicalDetails: errorMessage
  };
}

/**
 * Create an error notification object for the ErrorMessage component
 */
export function createErrorNotification(error, context) {
  const friendly = getUserFriendlyError(error);

  if (context === 'analysis') {
    friendly.message += ' If the problem persists, try a different file or template.';
  } else if (context === 'export') {
    friendly.message += ' Your data is still available — try exporting again.';
  }

  return friendly;
}

/**
 * Log error with context for debugging
 */
export function logError(error, context = {}) {
  console.error('[InstruMap Error]', {
    message: error?.message || String(error),
    stack: error?.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
}
