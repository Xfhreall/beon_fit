import { router } from '@inertiajs/react';
import { ArrowUpDown, ImageIcon, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
export { FieldError, requiredField } from '@/lib/tanstack-form';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export function money(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export function period(month: number, year: number): string {
    return `${monthName(month)} ${year}`;
}

export function monthName(month: number): string {
    return (
        new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(
            new Date(2026, month - 1, 1),
        ) || '-'
    );
}

export function formatWibDateTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00+07:00`)
        : new Date(value);

    return (
        new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
            .format(date)
            .replace(/\./g, ':') + ' WIB'
    );
}

export function StatusBadge({ value }: { value: string }) {
    const colors: Record<string, string> = {
        lunas: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
        dihuni: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
        sebagian:
            'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
        belum_lunas:
            'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
        tidak_dihuni:
            'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
        tetap: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
        kontrak:
            'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
        menikah:
            'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300',
        belum_menikah:
            'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300',
        rutin: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300',
        non_rutin:
            'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
    };

    return (
        <Badge variant="outline" className={colors[value] ?? undefined}>
            {value.replace(/_/g, ' ')}
        </Badge>
    );
}

export type SortDirection = 'asc' | 'desc';
export type SortState<Key extends string> = {
    key: Key;
    direction: SortDirection;
};

export function nextSort<Key extends string>(
    current: SortState<Key>,
    key: Key,
): SortState<Key> {
    return {
        key,
        direction:
            current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    };
}

export function compareSortValue(a: string | number, b: string | number) {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    return String(a).localeCompare(String(b), 'id-ID', {
        numeric: true,
        sensitivity: 'base',
    });
}

export function SortableTableHead<Key extends string>({
    sortKey,
    sort,
    onSort,
    children,
    className,
}: {
    sortKey: Key;
    sort: SortState<Key>;
    onSort: (key: Key) => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <TableHead className={className}>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 justify-start px-2"
                onClick={() => onSort(sortKey)}
            >
                {children}
                <ArrowUpDown
                    className={
                        sort.key === sortKey
                            ? 'size-3.5 opacity-100'
                            : 'size-3.5 opacity-45'
                    }
                />
                {sort.key === sortKey && (
                    <span className="sr-only">
                        {sort.direction === 'asc' ? 'Urut naik' : 'Urut turun'}
                    </span>
                )}
            </Button>
        </TableHead>
    );
}

export function EmptyRow({
    colSpan,
    label = 'Tidak ada data.',
}: {
    colSpan: number;
    label?: string;
}) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
            >
                {label}
            </TableCell>
        </TableRow>
    );
}

export function Pagination({ links }: { links: PaginationLink[] }) {
    const visibleLinks = links.filter(
        (link) => !['&laquo; Previous', 'Next &raquo;'].includes(link.label),
    );

    if (visibleLinks.length <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-end gap-1">
            {visibleLinks.map((link, index) => (
                <Button
                    key={`${link.label}-${index}`}
                    size="sm"
                    variant={link.active ? 'default' : 'outline'}
                    disabled={!link.url}
                    onClick={() =>
                        link.url &&
                        router.visit(link.url, { preserveScroll: true })
                    }
                >
                    {link.label}
                </Button>
            ))}
        </div>
    );
}

export function DebouncedSearchInput({
    url,
    filters,
    param = 'search',
    placeholder = 'Cari data',
}: {
    url: string;
    filters: Record<string, string>;
    param?: string;
    placeholder?: string;
}) {
    const [value, setValue] = useState(filters[param] ?? '');

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (value === (filters[param] ?? '')) {
                return;
            }

            router.get(
                url,
                { ...filters, [param]: value },
                { preserveState: true, preserveScroll: true },
            );
        }, 500);

        return () => window.clearTimeout(timeout);
    }, [filters, param, url, value]);

    return (
        <Input
            className="w-64"
            placeholder={placeholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
        />
    );
}

export function DetailDialog({
    title,
    open,
    onOpenChange,
    fields,
    children,
}: {
    title: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fields: Array<[string, ReactNode]>;
    children?: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                    {fields.map(([label, value]) => (
                        <div key={label} className="grid gap-1">
                            <span className="text-muted-foreground">
                                {label}
                            </span>
                            <span className="font-medium">{value}</span>
                        </div>
                    ))}
                </div>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function ConfirmDeleteButton({
    title,
    description,
    onConfirm,
    disabled,
}: {
    title: string;
    description: string;
    onConfirm: () => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <Trash2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={(event) => {
                            event.stopPropagation();
                            onConfirm();
                            setOpen(false);
                        }}
                    >
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ImageInput({
    name,
    label,
    onFile,
}: {
    name: string;
    label: string;
    onFile?: (file: File | null) => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    return (
        <div className="grid gap-2">
            <Input
                name={name}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    setPreview(file ? URL.createObjectURL(file) : null);
                    onFile?.(file ?? null);
                }}
            />
            <div className="flex min-h-28 items-center justify-center rounded-lg border bg-muted/30">
                {preview ? (
                    <img
                        src={preview}
                        alt={label}
                        className="max-h-40 rounded-md object-contain"
                    />
                ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="size-4" />
                        {label}
                    </div>
                )}
            </div>
        </div>
    );
}
