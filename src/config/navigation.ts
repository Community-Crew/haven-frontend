const t = (key: string) => key;

export interface NavItem {
    to: string;
    icon: string;
    labelKey: string;
    child?: boolean;
    mobilePriority?: boolean;
}

export const navigationItems: NavItem[] = [
    { to: 'home.index', icon: '🏠', labelKey: t('navigation.home'), mobilePriority: true },
    { to: 'rooms.index', icon: '🚪', labelKey: t('navigation.rooms'), mobilePriority: true },
    { to: 'reservations.index', icon: '🎟️', labelKey: t('navigation.reservations'), child: true },
    { to: 'agenda.index', icon: '📅', labelKey: t('navigation.agenda'), mobilePriority: true },
];