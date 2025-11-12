<template>
  <div class="container">
    <h1>🍪 Biscuit Demo</h1>

    <div v-if="!isChecked">
      <p>Loading...</p>
    </div>

    <div v-else-if="isGuest">
      <h2>Welcome, Guest!</h2>
      <p>You are not logged in.</p>
      <NuxtLink to="/login">
        Go to Login
      </NuxtLink>
    </div>

    <div v-else>
      <h2>Welcome, {{ user?.data?.name }}!</h2>
      <p>Email: {{ user?.data?.email }}</p>
      <button @click="handleLogout">
        Logout
      </button>
      <br>
      <NuxtLink to="/dashboard">
        Go to Dashboard
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isGuest, isChecked, logout, onUserChange } = useBiscuit()

const handleLogout = async () => {
  await logout()
}

// Listen to auth state changes
onUserChange((newUser) => {
  if (newUser) {
    console.log('User logged in:', newUser)
  }
  else {
    console.log('User logged out')
  }
})
</script>
