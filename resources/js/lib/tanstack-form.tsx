import { usePage } from '@inertiajs/react';

export function requiredField(label: string) {
    return ({ value }: { value: unknown }) =>
        typeof value === 'string' && value.trim() === ''
            ? `${label} wajib diisi.`
            : undefined;
}

export function useServerErrors() {
    return (usePage().props.errors ?? {}) as Record<string, string>;
}

export function FieldError({ errors }: { errors: unknown[] }) {
    const error = errors[0];

    if (!error) {
        return null;
    }

    return (
        <p className="text-xs font-medium text-destructive">
            {typeof error === 'string' ? error : String(error)}
        </p>
    );
}
