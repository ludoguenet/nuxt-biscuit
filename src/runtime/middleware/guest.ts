import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig()

  const { useBiscuit } = await import('../composables/useBiscuit')
  const { ensureSession, isAuthenticated } = useBiscuit()

  if (!isAuthenticated.value) {
    await ensureSession()
  }

  if (isAuthenticated.value) {
    return navigateTo(config.public.biscuit.redirect.onGuestOnly)
  }
})
