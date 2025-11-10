import { computed, type ComputedRef, type Ref } from 'vue'
import {
  navigateTo,
  useCookie,
  useNuxtApp,
  useRequestEvent,
  useRequestFetch,
  useRequestURL,
  useRuntimeConfig,
  useState
} from '#imports'
import type { RuntimeConfig } from '@nuxt/schema'

import { useBiscuitUser } from './useBiscuitUser'

export interface BiscuitUser {
  id: number
  name: string
  email: string
  [key: string]: any
}

export interface BiscuitCredentials {
  email: string
  password: string
  [key: string]: any
}

export interface UseBiscuitReturn {
  user: ComputedRef<BiscuitUser | null>
  account: Ref<BiscuitUser | null>
  isGuest: ComputedRef<boolean>
  isAuthenticated: ComputedRef<boolean>
  isChecked: ComputedRef<boolean>
  login: (credentials: BiscuitCredentials) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  refreshUser: () => Promise<void>
  ensureSession: () => Promise<boolean>
  bootstrap: () => Promise<void>
  onUserChange: (callback: (user: BiscuitUser | null) => void) => void
}

const CHECK_STATE_KEY = 'biscuit:checked'
const HOOKS_STATE_KEY = 'biscuit:hooks'

const callHook = async (nuxtApp: ReturnType<typeof useNuxtApp>, name: string, payload?: unknown) => {
  try {
    await nuxtApp.callHook(name, payload)
  } catch {
    // silently swallow hook errors to avoid breaking auth flow
  }
}

export const useBiscuit = (): UseBiscuitReturn => {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  const requestFetch = useRequestFetch()

  const biscuitConfig = config.public.biscuit as RuntimeConfig['public']['biscuit'] & {
    baseUrl: string
    endpoints: {
      csrf: string
      login: string
      logout: string
      user: string
    }
    redirect: {
      onLogin: string
      onLogout: string
      onAuthOnly: string
      onGuestOnly: string
    }
  }

  const account = useBiscuitUser<BiscuitUser>()
  const status = useState<boolean>(CHECK_STATE_KEY, () => false)
  const hookBag = useState<Array<(user: BiscuitUser | null) => void>>(HOOKS_STATE_KEY, () => [])

  const isAuthenticated = computed(() => account.value !== null)
  const user = computed(() => account.value)
  const isGuest = computed(() => !isAuthenticated.value)
  const isChecked = computed(() => status.value)

  const notifyChange = (previous: BiscuitUser | null, next: BiscuitUser | null) => {
    if (previous === next || !import.meta.client) {
      return
    }

    for (const hook of hookBag.value) {
      try {
        hook(next)
      } catch (error) {
        console.error('[nuxt-biscuit] onUserChange hook failed', error)
      }
    }
  }

  const withRequestHeaders = (headers?: Record<string, string>) => {
    const baseHeaders: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      ...headers
    }

    if (!import.meta.server) {
      return baseHeaders
    }

    const event = useRequestEvent()
    const requestUrl = useRequestURL()
    const forwarded: Record<string, string> = {}

    if (event) {
      const { cookie, referer, origin, 'x-xsrf-token': xsrf } = event.node.req.headers

      const normalize = (value?: string | string[]) =>
        Array.isArray(value) ? value.join('; ') : value

      const cookieHeader = normalize(cookie)
      if (cookieHeader) {
        forwarded.cookie = cookieHeader
      }

      const refererHeader = normalize(referer)
      if (refererHeader) {
        forwarded.referer = refererHeader
      }

      const originHeader = normalize(origin)
      if (originHeader) {
        forwarded.origin = originHeader
      }

      const xsrfHeader = normalize(xsrf)
      if (xsrfHeader) {
        forwarded['x-xsrf-token'] = xsrfHeader
      }
    }

    if (requestUrl) {
      const { href, origin } = requestUrl

      if (!forwarded.referer) {
        forwarded.referer = href
      }

      if (!forwarded.origin) {
        forwarded.origin = origin
      }
    }

    return {
      ...forwarded,
      ...baseHeaders
    }
  }

  const acquireCsrfCookie = async () => {
    await requestFetch(biscuitConfig.endpoints.csrf, {
      method: 'GET',
      baseURL: biscuitConfig.baseUrl,
      credentials: 'include',
      headers: withRequestHeaders()
    })
  }

  const resolveXsrfToken = () => {
    const token = useCookie<string | null>('XSRF-TOKEN')
    if (!token.value) {
      return null
    }

    try {
      return decodeURIComponent(token.value)
    } catch {
      return token.value
    }
  }

  const syncUser = async ({ muteErrors = true }: { muteErrors?: boolean } = {}) => {
    const previousUser = account.value

    try {
      const data = await requestFetch<BiscuitUser>(biscuitConfig.endpoints.user, {
        method: 'GET',
        baseURL: biscuitConfig.baseUrl,
        credentials: 'include',
        headers: withRequestHeaders()
      })

      account.value = data
      notifyChange(previousUser, data)
      await callHook(nuxtApp, 'biscuit:refresh', data)
    } catch (error) {
      if (account.value !== null) {
        account.value = null
      }
      notifyChange(previousUser, null)
      await callHook(nuxtApp, 'biscuit:refresh', null)

      if (!muteErrors) {
        throw error
      }
    } finally {
      status.value = true
    }
  }

  const ensureSession = async () => {
    if (!status.value) {
      await syncUser()
    }

    if (!isAuthenticated.value) {
      return false
    }

    const xsrfToken = resolveXsrfToken()
    if (!xsrfToken) {
      await syncUser()
    }

    return isAuthenticated.value
  }

  const bootstrap = async () => {
    if (status.value) {
      return
    }

    await syncUser()
    await callHook(nuxtApp, 'biscuit:init', account.value)
  }

  const login = async (credentials: BiscuitCredentials) => {
    await acquireCsrfCookie()

    const xsrfToken = resolveXsrfToken()

    await requestFetch(biscuitConfig.endpoints.login, {
      method: 'POST',
      baseURL: biscuitConfig.baseUrl,
      credentials: 'include',
      headers: withRequestHeaders(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : undefined),
      body: credentials
    })

    await syncUser({ muteErrors: false })
    await callHook(nuxtApp, 'biscuit:login', account.value)

    if (biscuitConfig.redirect.onLogin) {
      await callHook(nuxtApp, 'biscuit:redirect', biscuitConfig.redirect.onLogin)
      await navigateTo(biscuitConfig.redirect.onLogin)
    }
  }

  const logout = async () => {
    const xsrfToken = resolveXsrfToken()

    await requestFetch(biscuitConfig.endpoints.logout, {
      method: 'POST',
      baseURL: biscuitConfig.baseUrl,
      credentials: 'include',
      headers: withRequestHeaders(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : undefined)
    })

    const previousUser = account.value
    account.value = null
    notifyChange(previousUser, null)
    await callHook(nuxtApp, 'biscuit:logout', previousUser)

    if (biscuitConfig.redirect.onLogout) {
      await callHook(nuxtApp, 'biscuit:redirect', biscuitConfig.redirect.onLogout)
      await navigateTo(biscuitConfig.redirect.onLogout)
    }
  }

  const fetchUser = async () => {
    await syncUser()
  }

  const onUserChange = (callback: (user: BiscuitUser | null) => void) => {
    if (import.meta.client) {
      hookBag.value.push(callback)
    }
  }

  return {
    user,
    account,
    isGuest,
    isAuthenticated,
    isChecked,
    login,
    logout,
    fetchUser,
    refreshUser: fetchUser,
    ensureSession,
    bootstrap,
    onUserChange
  }
}
