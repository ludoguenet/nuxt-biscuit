import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { BiscuitUser } from '~/src/runtime/composables/useBiscuit'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    port: 40463,
  })

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  it('retrieves Sanctum CSRF cookie', async () => {
    const response = await $fetch('/api/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include', // necessary for cookies
    })

    // `$fetch` swallows empty 204s, so just asserting no exception is enough
    expect(response).toBeUndefined()
  })

  it('can retrieve the logged-in user', async () => {
    const user: { data: BiscuitUser } = await $fetch('/api/user')

    expect(user.data).toBeDefined()
    expect(user.data.id).toBe(195)
    expect(user.data.name).toBe('Edward The Great')
  })
})
