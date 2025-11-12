import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],

  runtimeConfig: {
    public: {
      biscuit: {
        baseUrl: '/',
        endpoints: {
          csrf: '/api/csrf',
          user: '/api/user',
        },
      },
    },
  },
})
