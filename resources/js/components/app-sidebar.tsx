import { Link } from '@inertiajs/react';
import {
    BookOpen,
    FolderGit2,
    Home,
    LayoutGrid,
    Receipt,
    ScrollText,
    Users,
    WalletCards,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as expensesIndex } from '@/routes/expenses';
import { index as housesIndex } from '@/routes/houses';
import { index as paymentsIndex } from '@/routes/payments';
import { index as reportsIndex } from '@/routes/reports';
import { index as residentsIndex } from '@/routes/residents';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Penghuni',
        href: residentsIndex(),
        icon: Users,
    },
    {
        title: 'Rumah',
        href: housesIndex(),
        icon: Home,
    },
    {
        title: 'Pembayaran',
        href: paymentsIndex(),
        icon: WalletCards,
    },
    {
        title: 'Pengeluaran',
        href: expensesIndex(),
        icon: Receipt,
    },
    {
        title: 'Laporan',
        href: reportsIndex(),
        icon: ScrollText,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
