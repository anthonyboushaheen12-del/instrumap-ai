/**
 * File validation utilities
 */

// Configuration
export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ],
  allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg']
};

/**
 * Validate a single file
 */
export function validateFile(file) {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided'
    };
  }

  // Check file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  if (file.size > FILE_LIMITS.maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (FILE_LIMITS.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`
    };
  }

  // Check file type
  if (!FILE_LIMITS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: PDF, PNG, JPG`
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_LIMITS.allowedExtensions.some(ext =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${FILE_LIMITS.allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files) {
  const validFiles = [];
  const errors = [];

  files.forEach(file => {
    const result = validateFile(file);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  });

  return {
    valid: validFiles.length > 0,
    validFiles,
    errors
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
