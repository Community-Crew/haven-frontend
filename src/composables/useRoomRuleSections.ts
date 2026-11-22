import {computed, type MaybeRefOrGetter, toValue} from 'vue'
import {useI18n} from 'vue-i18n'
import type {RoomRule, RoomRules} from '@/types/room'

/**
 * The rule groups that have rules, in the resident's language (falling back
 * to the leading Dutch text).
 */
export const useRoomRuleSections = (rules: MaybeRefOrGetter<RoomRules | null>) => {
    const {t, locale} = useI18n()

    const items = (prefix: string, list: RoomRule[]) => list.map((rule, index) => ({
        key: `${prefix}-${index}`,
        text: (locale.value === 'en' && rule.text_en) || rule.text,
    }))

    return computed(() => {
        const current = toValue(rules)
        if (!current) return []

        return [
            {key: 'general', title: t('room_rules.general'), items: items('general', current.default_rules)},
            {key: 'room', title: t('room_rules.this_room'), items: items('room', current.rules)},
        ].filter(section => section.items.length > 0)
    })
}
