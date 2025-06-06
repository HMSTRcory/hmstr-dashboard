export function spc(
  source: string,
  ppcSources: string[],
  lsaSources: string[],
  seoSources: string[]
): 'ppc' | 'lsa' | 'seo' | 'other' {
  if (ppcSources.includes(source)) return 'ppc';
  if (lsaSources.includes(source)) return 'lsa';
  if (seoSources.includes(source)) return 'seo';
  return 'other';
}
