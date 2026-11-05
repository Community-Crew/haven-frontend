<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { FlowStep, FlowTone } from "@/types/faq.ts"
import { openLink } from "@/utils/openLink.ts"

// Recursive: a step with branches renders each branch as its own FlowChart
// next to the other. A decision inside a branch stacks its branches
// instead, since half of a half is too narrow on a phone.
defineProps<{
  steps: FlowStep[];
  nested?: boolean;
}>()

const { locale } = useI18n()
const router = useRouter()

// English falls back to the Dutch text where nothing was translated.
const localized = (dutch: string | null, english: string | null) =>
    locale.value === 'en' && english ? english : dutch

const toneClass: Record<FlowTone, string> = {
  default: 'bg-white dark:bg-slate-800 border-haven-blue/15 dark:border-white/10',
  good: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
  bad: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  wait: 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
}
</script>

<template>
  <ol class="flex flex-col items-stretch">
    <li v-for="(step, index) in steps" :key="index" class="flex flex-col items-center">
      <div
          v-if="index > 0"
          class="w-0.5 h-5 bg-haven-blue/25 dark:bg-white/25"
          aria-hidden="true"
      />

      <component
          :is="step.url ? 'button' : 'div'"
          :type="step.url ? 'button' : undefined"
          class="w-full rounded-xl border px-3 py-2 flex items-start gap-2 shadow-sm text-left"
          :class="[
            toneClass[step.tone] ?? toneClass.default,
            step.branches.length ? 'border-dashed' : '',
            step.url ? 'cursor-pointer active:scale-[0.98] transition-transform hover:ring-2 hover:ring-haven-blue/20 dark:hover:ring-haven-yellow/30' : '',
          ]"
          @click="step.url && openLink(step.url, router)"
      >
        <span v-if="step.icon" class="text-lg leading-none mt-0.5">{{ step.icon }}</span>
        <div class="min-w-0 break-words flex-1">
          <p class="text-xs md:text-sm font-bold text-haven-blue dark:text-haven-white">
            {{ localized(step.title, step.title_en) }}
          </p>
          <p
              v-if="localized(step.detail, step.detail_en)"
              class="text-[11px] md:text-xs text-haven-blue/60 dark:text-white/60"
          >
            {{ localized(step.detail, step.detail_en) }}
          </p>
        </div>
        <span v-if="step.url" class="text-haven-blue/40 dark:text-white/40 text-sm self-center" aria-hidden="true">➔</span>
      </component>

      <div
          v-if="step.branches.length"
          class="w-full grid gap-2 md:gap-3"
          :class="nested || step.branches.length === 1 ? 'grid-cols-1' : 'grid-cols-2'"
      >
        <div v-for="(branch, branchIndex) in step.branches" :key="branchIndex" class="flex flex-col items-center min-w-0">
          <div class="w-0.5 h-3 bg-haven-blue/25 dark:bg-white/25" aria-hidden="true"/>
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue">
            {{ localized(branch.label, branch.label_en) }}
          </span>
          <div class="w-0.5 h-3 bg-haven-blue/25 dark:bg-white/25" aria-hidden="true"/>
          <FlowChart :steps="branch.steps" nested class="w-full"/>
        </div>
      </div>
    </li>
  </ol>
</template>
