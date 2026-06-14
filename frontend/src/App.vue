<template>
  <div id="app">
    <header>
      <h1>Vue 3 + Keycloak (TypeScript)</h1>

      <div v-if="authState.isAuthenticated">
        <p>Welcome, {{ authState.user?.preferred_username }}!</p>
        <button @click="handleLogout">Logout</button>

        <button @click="getResponse" :disabled="loading">
          {{ loading ? 'Loading...' : 'Fetch API' }}
        </button>

        <div v-if="apiData" class="api-result">
          <pre>{{ apiData }}</pre>
        </div>
        <div v-else-if="error" class="error">{{ error }}</div>
      </div>

      <button v-else @click="handleLogin">Login with Keycloak</button>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authState, login, logout } from './services/keycloak';
import {roomService} from "@/services/roomService.ts";

const handleLogin = (): Promise<void> => login();
const handleLogout = (): Promise<void> => logout();

const apiData = ref<any>(null);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const getResponse = async () => {
  loading.value = true;
  error.value = null;
  apiData.value = null;

  try {
    const data = await roomService.getRooms();
    apiData.value = data;
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || 'Failed to fetch user data.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.api-result {
  margin-top: 15px;
  padding: 10px;
  background: #f4f4f4;
  border-radius: 4px;
  text-align: left;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>