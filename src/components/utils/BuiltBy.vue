<script setup lang="ts">
import { ref } from 'vue'

const HEARTS = ['❤️', '🧡', '💛', '💙', '💚', '🩷']

const clicks = ref(0)
const isPopping = ref(false)

// Hearts are appended to <body> so they can fly over everything, including
// the sidebar's overflow-hidden container.
const burst = (event: MouseEvent) => {
  clicks.value++
  isPopping.value = false
  requestAnimationFrame(() => (isPopping.value = true))

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { left, top, width, height } = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const originX = left + width / 2
  const originY = top + height / 2
  const count = Math.min(12 + clicks.value * 4, 60)

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span')
    heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)]!
    heart.setAttribute('aria-hidden', 'true')
    Object.assign(heart.style, {
      position: 'fixed',
      left: `${originX}px`,
      top: `${originY}px`,
      fontSize: `${12 + Math.random() * 16}px`,
      pointerEvents: 'none',
      zIndex: '9999',
      userSelect: 'none',
    })
    document.body.appendChild(heart)

    const angle = Math.random() * Math.PI * 2
    const distance = 60 + Math.random() * 160
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance - 120 - Math.random() * 120
    const spin = (Math.random() - 0.5) * 120

    heart
        .animate(
            [
              { transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)', opacity: 1 },
              { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${spin}deg)`, opacity: 0 },
            ],
            { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' },
        )
        .finished.finally(() => heart.remove())
  }
}
</script>

<template>
  <i18n-t keypath="general.built_by" tag="span">
    <template #heart>
      <button
          type="button"
          @click="burst"
          @animationend="isPopping = false"
          class="inline-block cursor-pointer hover:scale-125 transition-transform"
          :class="{ 'animate-[heart-pop_400ms_ease-out]': isPopping }"
          aria-label="❤️"
      >❤️</button>
    </template>
    <template #name>
      <a
          href="https://github.com/Kroffie"
          target="_blank"
          rel="noopener noreferrer"
          class="underline underline-offset-2 hover:text-haven-yellow transition-colors"
      >Tim</a>
    </template>
  </i18n-t>
</template>

<style>
@keyframes heart-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.8); }
  100% { transform: scale(1); }
}
</style>
