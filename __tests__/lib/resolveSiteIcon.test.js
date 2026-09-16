import { resolveSiteIcon } from '@/lib/db/notion/resolveSiteIcon'
import notionAPI from '@/lib/db/notion/getNotionAPI'

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __call: jest.fn()
}))

const spaceId = '47cc7376-8888-47c1-9ae1-12b767a318bf'
const id = '3752186a-d85d-80a3-b25a-007a1c0fb1df'
const icon = `notion://custom_emoji/${spaceId}/${id}`
const url = 'https://example.com/avatar.png'

it('resolves a custom emoji using its space and record IDs', async () => {
  notionAPI.__call.mockResolvedValue({ results: [{ value: { url } }] })
  expect(await resolveSiteIcon(icon)).toBe(url)
  expect(notionAPI.__call).toHaveBeenCalledWith('fetch', {
    endpoint: 'getRecordValues',
    ofetchOptions: { timeout: 10000 },
    body: { requests: [{ table: 'custom_emoji', id, spaceId }] }
  })
})

it.each([{ value: { url } }, { value: { value: { url } } }])(
  'uses cached records without an API request',
  async record => {
    expect(await resolveSiteIcon(icon, { custom_emoji: { [id]: record } })).toBe(url)
    expect(notionAPI.__call).not.toHaveBeenCalled()
  }
)

it.each(['/avatar.png', url])('preserves ordinary image URLs', async source => {
  expect(await resolveSiteIcon(source)).toBe(source)
  expect(notionAPI.__call).not.toHaveBeenCalled()
})

it('falls back for inaccessible or invalid emoji records', async () => {
  notionAPI.__call.mockResolvedValue({ results: [{}] })
  expect(await resolveSiteIcon(icon)).toBe('/avatar.svg')
  notionAPI.__call.mockRejectedValue(new Error('Unavailable'))
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
  expect(await resolveSiteIcon(icon)).toBe('/avatar.svg')
  warning.mockRestore()
  expect(await resolveSiteIcon('notion://invalid')).toBe('/avatar.svg')
})
