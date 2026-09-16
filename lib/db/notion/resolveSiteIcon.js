import notionAPI from './getNotionAPI'

// Custom emoji URIs are Notion record pointers, not browser image URLs.
export async function resolveSiteIcon(icon, recordMap = {}, fallback = '/avatar.svg') {
  if (!icon?.startsWith('notion://')) return icon || fallback

  const match = /^notion:\/\/custom_emoji\/([\da-f-]+)\/([\da-f-]+)$/i.exec(icon)
  if (!match) return fallback
  const [, spaceId, id] = match

  const imageUrl = record => {
    const value = record?.value?.value || record?.value || record
    return /^https?:\/\//i.test(value?.url || '') ? value.url : null
  }

  const cached = imageUrl(recordMap.custom_emoji?.[id])
  if (cached) return cached

  try {
    const response = await notionAPI.__call('fetch', {
      endpoint: 'getRecordValues',
      ofetchOptions: { timeout: 10000 },
      body: { requests: [{ table: 'custom_emoji', id, spaceId }] }
    })
    return imageUrl(response?.results?.[0]) || fallback
  } catch (error) {
    console.warn('[resolveSiteIcon] Could not load custom emoji:', id)
    return fallback
  }
}
