export interface Room {
    id: number
    name: string
    slug: string
    description: string
    location: string
    status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning'
    image_url: string
}