
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
};

export function getApiUrl(path: string): string {
  // Check for override in localStorage (client-side only)
  let baseUrl = API_CONFIG.baseUrl;
  
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('api_url_override');
    if (override) {
      baseUrl = override;
    }
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return cleanBaseUrl ? `${cleanBaseUrl}/${cleanPath}` : `/${cleanPath}`;
}
