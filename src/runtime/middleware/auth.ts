import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig()

  const { useBiscuit } = await import('../composables/useBiscuit')
  const { ensureSession } = useBiscuit()

  const hasSession = await ensureSession()

  if (!hasSession) {
    return navigateTo(config.public.biscuit.redirect.onAuthOnly)
  }
})
