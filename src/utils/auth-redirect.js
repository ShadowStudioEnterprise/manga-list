export function authDestination(redirect) {
  if (
    typeof redirect !== 'string' ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    /[\\\r\n]/.test(redirect)
  ) {
    return '/library'
  }

  // Only return to private application routes, never back into authentication.
  const path = redirect.split(/[?#]/, 1)[0]
  return /^\/(?:library|add|manga\/[^/]+|settings(?:\/import-export)?)$/.test(path)
    ? redirect
    : '/library'
}

export function authRoute(path, redirect) {
  const destination = authDestination(redirect)
  return { path, query: destination === '/library' ? {} : { redirect: destination } }
}
