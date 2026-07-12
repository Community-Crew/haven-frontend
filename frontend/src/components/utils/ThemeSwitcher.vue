<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

const setTheme = (dark: boolean) => {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const toggleTheme = () => {
  setTheme(!isDark.value)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setTheme(true)
  } else {
    setTheme(false)
  }
})
</script>

<template>
  <div class="p-2">
    <button
        @click="toggleTheme"
        class="relative h-9 w-18 cursor-pointer rounded-full border-2 border-haven-blue dark:border-haven-white transition-colors duration-200 shadow-[2px_2px_0px_0px_#091d4b] dark:shadow-[2px_2px_0px_0px_var(--color-haven-white)] focus:outline-none"
        :class="isDark ? 'bg-haven-blue' : 'bg-haven-white'"
    >
      <span
          class="absolute top-0.5 left-0.5 h-7 w-7 rounded-full border-2 border-haven-blue dark:border-haven-white transition-transform duration-200 shadow-[1px_1px_0px_0px_#091d4b]"
          :class="isDark ? 'translate-x-9 bg-haven-pink' : 'translate-x-0 bg-haven-yellow'"
      >
        <span class="w-full h-full flex items-center justify-center text-haven-blue">
          <svg
              v-if="!isDark"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="3"
              stroke="currentColor"
              class="w-4 h-4 text-haven-red"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M4.22 19.78l1.59-1.59M18.2 5.8l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
          </svg>

          <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              class="w-3.5 h-3.5 text-haven-white"
          >
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </span>
      </span>
    </button>
    <div class="p-2 mt-2 bg-haven-red/60 rounded-full" v-if="isDark">
      <p class="font-bold">
        {{ $t('general.darkmode_beta')}}
      </p>
    </div>
  </div>
</template>