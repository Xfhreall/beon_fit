import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function RequestLoadingIndicator() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const offStart = router.on('start', () => setLoading(true));
        const offFinish = router.on('finish', () => setLoading(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    if (!loading) {
        return null;
    }

    return (
        <div className="fixed top-3 right-3 z-50 inline-flex h-8 items-center gap-2 rounded-lg border bg-popover px-3 text-sm text-popover-foreground shadow-md">
            <Loader2 className="size-4 animate-spin" />
            Memproses
        </div>
    );
}
