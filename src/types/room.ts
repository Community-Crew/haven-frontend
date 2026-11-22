export interface Room {
    id: number
    name: string
    slug: string
    description: string
    location: string
    status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning'
    image_url: string
}

export interface RoomRule {
    text: string
    text_en: string | null
}

/** The rules for every room plus this room's own. No hash means no rules at all. */
export interface RoomRules {
    default_rules: RoomRule[]
    rules: RoomRule[]
    rules_hash: string | null
}