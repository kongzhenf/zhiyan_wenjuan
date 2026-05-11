import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const username = ref<string>(localStorage.getItem('username') || '')

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function setUsername(name: string) {
    username.value = name
    localStorage.setItem('username', name)
  }

  function clearAuth() {
    accessToken.value = ''
    refreshToken.value = ''
    username.value = ''
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
  }

  return {
    accessToken,
    refreshToken,
    username,
    setTokens,
    setUsername,
    clearAuth
  }
})
