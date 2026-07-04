import { router } from '@inertiajs/react';
import { ImageIcon, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';

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
    return `${String(month).padStart(2, '0')}/${year}`;
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
    const variant =
        value === 'lunas' || value === 'dihuni'
            ? 'default'
            : value === 'sebagian'
              ? 'secondary'
              : 'outline';

    return <Badge variant={variant}>{value.replace('_', ' ')}</Badge>;
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
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={(event) => event.stopPropagation()}
                >
                    <Trash2 className="size-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={(event) => {
                            event.stopPropagation();
                            onConfirm();
                        }}
                    >
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
