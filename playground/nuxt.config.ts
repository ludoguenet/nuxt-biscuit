export default defineNuxtConfig({
  modules: ['../src/module'],

  compatibilityDate: '2025-11-10',

  biscuit: {
    baseUrl: 'http://localhost:8000',
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      logout: '/logout',
      user: '/api/user',
    },
    redirect: {
      onLogin: '/dashboard',
      onLogout: '/login',
      onAuthOnly: '/login',
      onGuestOnly: '/dashboard',
    },
  },

  devtools: { enabled: true },
})
