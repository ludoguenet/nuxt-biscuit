<template>
  <div class="container">
    <h1>Login</h1>

    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="credentials.email"
          type="email"
          required
        >
      </div>

      <div>
        <label for="password">Password:</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          required
        >
      </div>

      <button
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <p
        v-if="error"
        style="color: red;"
      >
        {{ error }}
      </p>
    </form>

    <NuxtLink to="/">
      Back to Home
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

const { login } = useBiscuit()

const credentials = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await login(credentials.value)
  }
  catch (e: unknown) {
    const errorData = e && typeof e === 'object' && 'data' in e
      ? (e as { data?: { message?: string } }).data
      : null
    error.value = errorData?.message || 'Login failed'
  }
  finally {
    loading.value = false
  }
}
</script>
