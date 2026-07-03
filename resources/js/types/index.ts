import type { Auth } from './auth';

export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type SharedPageProps = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
};
