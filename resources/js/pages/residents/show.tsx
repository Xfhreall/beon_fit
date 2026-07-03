import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyRow, StatusBadge } from '../rt-finance/shared';

type Occupancy = {
    id: number;
    started_at: string;
    ended_at: string | null;
    resident_status: string;
    house: { number: string; block: string | null };
};

type Resident = {
    name: string;
    phone: string;
    resident_status: string;
    marital_status: string;
    occupancies: Occupancy[];
};

export default function ResidentShow({ resident }: { resident: Resident }) {
    return (
        <>
            <Head title={resident.name} />
            <div className="grid gap-4 p-4">
                <Card>
                    <CardHeader><CardTitle>{resident.name}</CardTitle></CardHeader>
                    <CardContent className="grid gap-2 text-sm md:grid-cols-4">
                        <div><span className="text-muted-foreground">Telepon</span><div>{resident.phone}</div></div>
                        <div><span className="text-muted-foreground">Status</span><div><StatusBadge value={resident.resident_status} /></div></div>
                        <div><span className="text-muted-foreground">Pernikahan</span><div>{resident.marital_status.replace('_', ' ')}</div></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Riwayat rumah</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Rumah</TableHead><TableHead>Mulai</TableHead><TableHead>Selesai</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{resident.occupancies.length === 0 ? <EmptyRow colSpan={4} /> : resident.occupancies.map((occupancy) => <TableRow key={occupancy.id}><TableCell>{occupancy.house.number}</TableCell><TableCell>{occupancy.started_at}</TableCell><TableCell>{occupancy.ended_at ?? '-'}</TableCell><TableCell>{occupancy.resident_status}</TableCell></TableRow>)}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
