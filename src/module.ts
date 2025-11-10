import { defineNuxtModule, addPlugin, createResolver, addImports, addRouteMiddleware } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
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

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-biscuit',
    configKey: 'biscuit',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },
  defaults: {
    baseUrl: 'http://localhost:8000',
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      logout: '/logout',
      user: '/api/user'
    },
    redirect: {
      onLogin: '/',
      onLogout: '/login',
      onAuthOnly: '/login',
      onGuestOnly: '/'
    }
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Expose options to runtime using defu for proper merging
    nuxt.options.runtimeConfig.public.biscuit = defu(
      nuxt.options.runtimeConfig.public.biscuit as any,
      options
    )

    // Add plugin for state management
    addPlugin(resolve('./runtime/plugin'))

    // Add composables
    addImports([
      {
        name: 'useBiscuit',
        as: 'useBiscuit',
        from: resolve('./runtime/composables/useBiscuit')
      },
      {
        name: 'useBiscuitUser',
        as: 'useBiscuitUser',
        from: resolve('./runtime/composables/useBiscuitUser')
      }
    ])

    // Add middleware
    addRouteMiddleware({
      name: 'auth',
      path: resolve('./runtime/middleware/auth'),
      global: false
    })

    addRouteMiddleware({
      name: 'guest',
      path: resolve('./runtime/middleware/guest'),
      global: false
    })
  }
})
