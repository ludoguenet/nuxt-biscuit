import { useBiscuitUser } from './composables/useBiscuitUser'
import type { BiscuitUser } from './composables/useBiscuit'
import { defineNuxtPlugin, useState } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const user = useBiscuitUser<BiscuitUser>()
  const isChecked = useState<boolean>('biscuit:checked', () => false)
  const hooks = useState<Array<(user: BiscuitUser | null) => void>>('biscuit:hooks', () => [])

  if (import.meta.client) {
    nuxtApp.hook('app:mounted', async () => {
      const { useBiscuit } = await import('./composables/useBiscuit')
      const { bootstrap } = useBiscuit()

      try {
        await bootstrap()
      }
      catch {
        // silently ignore; composable handles its own error state
      }
    })
  }

  return {
    provide: {
      biscuit: {
        user,
        isChecked,
        hooks,
      },
    },
  }
})
