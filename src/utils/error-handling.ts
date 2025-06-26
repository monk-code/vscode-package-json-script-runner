export const formatUserError = (error: unknown, context: string): string => {
  const prefix = `Error ${context}:`

  if (error === null || error === undefined) {
    return `${prefix} Unknown error occurred`
  }

  if (error instanceof Error) {
    return `${prefix} ${error.message}`
  }

  if (typeof error === 'string') {
    return `${prefix} ${error}`
  }

  // Handle Node.js error objects with code property
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const nodeError = error as { code: string; path?: string }

    switch (nodeError.code) {
      case 'ENOENT':
        return `${prefix} The specified file or directory not found${nodeError.path ? `: ${nodeError.path}` : ''}`
      case 'EACCES':
        return `${prefix} Permission denied${nodeError.path ? `: ${nodeError.path}` : ''}`
      case 'EISDIR':
        return `${prefix} Expected a file but found a directory${nodeError.path ? `: ${nodeError.path}` : ''}`
      default:
        return `${prefix} ${nodeError.code}${nodeError.path ? ` (${nodeError.path})` : ''}`
    }
  }

  return `${prefix} Unknown error occurred`
}
