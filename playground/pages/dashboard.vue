<template>
  <div class="container">
    <h1>Dashboard</h1>
    <p>This is a protected page.</p>

    <div v-if="user">
      <h2>User Info:</h2>
      <pre>{{ user }}</pre>
    </div>

    <button @click="handleLogout">Logout</button>
    <br>
    <NuxtLink to="/">Back to Home</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useBiscuit()

const handleLogout = async () => {
  await logout()
}
</script>
