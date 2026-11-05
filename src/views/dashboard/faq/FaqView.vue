<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppLayout from "@/layouts/AppLayout.vue"
import PageTitle from "@/components/utils/PageTitle.vue"
import LoadingPlaceholder from "@/components/utils/LoadingPlaceholder.vue"
import FlowChart from "@/components/faq/FlowChart.vue"
import { faqService } from "@/services/faqService.ts"
import type { FaqCategory } from "@/types/faq.ts"
import { sanitizeHtml } from "@/utils/sanitizeHtml.ts"
import { openLink } from "@/utils/openLink.ts"

const { locale } = useI18n()
const router = useRouter()

const categories = ref<FaqCategory[]>([])
const isLoading = ref(true)
const loadFailed = ref(false)

const search = ref('')
const activeCategory = ref<number | null>(null)
const openQuestions = ref(new Set<number>())

onMounted(async () => {
  try {
    categories.value = await faqService.getFaq()
  } catch {
    loadFailed.value = true
  } finally {
    isLoading.value = false
  }
})

// English falls back to the Dutch text where nothing was translated.
const localized = (dutch: string, english: string | null) =>
    locale.value === 'en' && english ? english : dutch

// For searching: the answer's text without its HTML.
const plainText = (html: string) =>
    new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''

// Links in an answer go through openLink(), so an app path stays inside the
// app instead of reloading it (and on iOS/Android, leaving it).
const onAnswerClick = (event: MouseEvent) => {
  const link = (event.target as HTMLElement).closest('a')
  const href = link?.getAttribute('href')
  if (!href) return

  event.preventDefault()
  openLink(href, router)
}

const toggle = (id: number) => {
  const next = new Set(openQuestions.value)
  next.has(id) ? next.delete(id) : next.add(id)
  openQuestions.value = next
}

// Searching ignores the category filter, so nothing is hidden behind a chip.
const visibleCategories = computed(() => {
  const query = search.value.trim().toLowerCase()

  return categories.value
      .filter(category => query || activeCategory.value === null || category.id === activeCategory.value)
      .map(category => ({
        id: category.id,
        icon: category.icon,
        title: localized(category.title, category.title_en),
        flowchart: category.flowchart?.length ? category.flowchart : null,
        questions: category.questions
            .map(question => ({
              id: question.id,
              question: localized(question.question, question.question_en),
              answer: sanitizeHtml(localized(question.answer, question.answer_en)),
            }))
            .filter(question => !query || `${question.question} ${plainText(question.answer)}`.toLowerCase().includes(query)),
      }))
      .filter(category => category.questions.length || (!query && category.flowchart))
})

const isOpen = (id: number) => openQuestions.value.has(id) || !!search.value
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <PageTitle :title="$t('faq.title')" :sub-title="$t('faq.subtitle')"/>

      <LoadingPlaceholder :is-loading="isLoading"/>

      <p v-if="loadFailed" class="text-sm text-haven-red text-center py-8">
        {{ $t('faq.load_failed') }}
      </p>

      <template v-if="!isLoading && !loadFailed">
        <input
            v-model="search"
            type="search"
            :placeholder="$t('faq.search_placeholder')"
            class="w-full rounded-2xl border border-gray-100 dark:border-white/10 bg-white/60 dark:bg-slate-800 px-4 py-3 text-sm text-haven-blue dark:text-haven-white placeholder:text-haven-blue/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-haven-blue/30 dark:focus:ring-haven-yellow/40"
        />

        <div v-if="!search" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
              type="button"
              class="shrink-0 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              :class="activeCategory === null ? 'bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue' : 'bg-white/60 dark:bg-white/10 text-haven-blue dark:text-white/80'"
              @click="activeCategory = null"
          >
            {{ $t('faq.all') }}
          </button>
          <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="shrink-0 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              :class="activeCategory === category.id ? 'bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue' : 'bg-white/60 dark:bg-white/10 text-haven-blue dark:text-white/80'"
              @click="activeCategory = category.id"
          >
            {{ category.icon }} {{ localized(category.title, category.title_en) }}
          </button>
        </div>

        <p v-if="!visibleCategories.length" class="text-sm text-haven-blue/60 dark:text-white/60 text-center py-8">
          {{ search ? $t('faq.no_results') : $t('faq.empty') }}
        </p>

        <section
            v-for="category in visibleCategories"
            :key="category.id"
            class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5">
            <h3 class="font-black text-sm text-haven-blue dark:text-haven-white tracking-wide uppercase">
              {{ category.icon }} {{ category.title }}
            </h3>
          </div>

          <div v-if="category.flowchart && !search" class="px-4 md:px-6 py-5 border-b border-gray-100 dark:border-white/10 bg-haven-blue/[0.03] dark:bg-black/10">
            <div class="max-w-lg mx-auto">
              <FlowChart :steps="category.flowchart"/>
            </div>
          </div>

          <ul class="divide-y divide-gray-100 dark:divide-white/10">
            <li v-for="question in category.questions" :key="question.id">
              <button
                  type="button"
                  class="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
                  :aria-expanded="isOpen(question.id)"
                  @click="toggle(question.id)"
              >
                <span class="text-sm font-bold text-haven-blue dark:text-haven-white">{{ question.question }}</span>
                <span
                    class="text-haven-blue/40 dark:text-white/40 transition-transform shrink-0"
                    :class="isOpen(question.id) ? 'rotate-180' : ''"
                >▾</span>
              </button>
              <div
                  v-if="isOpen(question.id)"
                  class="px-6 pb-4 -mt-1 text-sm text-haven-blue/70 dark:text-white/70
                         [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic
                         [&_a]:text-haven-blue [&_a]:dark:text-haven-yellow [&_a]:underline [&_a]:font-semibold
                         [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1"
                  @click="onAnswerClick"
                  v-html="question.answer"
              />
            </li>
          </ul>
        </section>
      </template>
    </div>
  </AppLayout>
</template>
