export interface ModrinthHit {
  project_id: string
  slug?: string
  title: string
  description: string
  downloads: number
  icon_url?: string
  author?: string
  categories?: string[]
}

export interface ModrinthProject {
  id?: string
  slug?: string
  title?: string
  description?: string
  downloads?: number
  icon_url?: string
  body?: string
  gallery?: Array<{ url: string; featured?: boolean }>
  categories?: string[]
}

export interface ModCard {
  projectId: string
  slug: string
  version: string
  title: string
  description: string
  fullDescription: string
  downloads: number
  iconUrl: string
  bannerUrl: string
  gallery: string[]
  author: string
  categories: string[]
  recommended: boolean
}

const RECOMMENDED_SLUGS = ['sodium', 'lithium', 'iris', 'fabric-api', 'jei', 'modmenu', 'sodium-extra', 'entityculling']

const stripMarkdown = (text: string): string =>
  text
    .replace(/[#*_`>\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const mapModCard = (
  hit: ModrinthHit,
  version: string,
  project: ModrinthProject | null,
  recommended: boolean,
): ModCard => {
  const gallery = (project?.gallery ?? []).map((item) => item.url).filter(Boolean)
  const featured = project?.gallery?.find((item) => item.featured)?.url
  const iconUrl = hit.icon_url ?? project?.icon_url ?? ''
  const bannerUrl = featured ?? gallery[0] ?? iconUrl
  const fullBody = project?.body ? stripMarkdown(project.body).slice(0, 400) : hit.description

  return {
    projectId: hit.project_id,
    slug: hit.slug ?? hit.project_id,
    version,
    title: hit.title,
    description: hit.description,
    fullDescription: fullBody,
    downloads: hit.downloads,
    iconUrl,
    bannerUrl,
    gallery: gallery.length ? gallery : iconUrl ? [iconUrl] : [],
    author: hit.author ?? 'Unknown',
    categories: hit.categories ?? [],
    recommended,
  }
}

export const fetchModrinthProject = async (idOrSlug: string): Promise<ModrinthProject | null> => {
  try {
    const response = await fetch(`https://api.modrinth.com/v2/project/${idOrSlug}`)
    if (!response.ok) return null
    return (await response.json()) as ModrinthProject
  } catch {
    return null
  }
}

export const searchModrinth = async (query: string, version: string, limit = 20): Promise<ModrinthHit[]> => {
  const facets = encodeURIComponent(JSON.stringify([[`versions:${version}`], ['project_type:mod']]))
  const response = await fetch(
    `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${facets}&limit=${limit}`,
  )
  if (!response.ok) throw new Error('Каталог Modrinth недоступен.')
  const data = (await response.json()) as { hits: ModrinthHit[] }
  return data.hits
}

export const fetchRecommendedHits = async (version: string): Promise<ModrinthHit[]> => {
  const facets = encodeURIComponent(JSON.stringify([[`versions:${version}`], ['project_type:mod']]))
  const byDownloads = await fetch(
    `https://api.modrinth.com/v2/search?index=downloads&facets=${facets}&limit=12`,
  )
  const topHits: ModrinthHit[] = byDownloads.ok ? ((await byDownloads.json()) as { hits: ModrinthHit[] }).hits : []

  const slugHits = await Promise.all(
    RECOMMENDED_SLUGS.map(async (slug) => {
      try {
        const res = await fetch(`https://api.modrinth.com/v2/project/${slug}`)
        if (!res.ok) return null
        const project = (await res.json()) as ModrinthProject
        if (!project.id && !project.title) return null
        return {
          project_id: project.id!,
          slug: project.slug ?? slug,
          title: project.title ?? slug,
          description: project.description ?? '',
          downloads: project.downloads ?? 0,
          icon_url: project.icon_url,
          categories: project.categories,
        } satisfies ModrinthHit
      } catch {
        return null
      }
    }),
  )

  const merged = new Map<string, ModrinthHit>()
  for (const hit of [...slugHits.filter(Boolean), ...topHits] as ModrinthHit[]) {
    merged.set(hit.project_id, hit)
  }
  return [...merged.values()].slice(0, 12)
}

export const enrichMods = async (hits: ModrinthHit[], version: string, recommended: boolean): Promise<ModCard[]> => {
  const projects = await Promise.all(hits.map((hit) => fetchModrinthProject(hit.slug ?? hit.project_id)))
  return hits.map((hit, index) => mapModCard(hit, version, projects[index], recommended))
}
