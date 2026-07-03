import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { assignResident, destroy, endOccupancy, index, store, update } from '@/actions/App/Http/Controllers/HouseController';
import { ConfirmDeleteButton, DebouncedSearchInput, DetailDialog, EmptyRow, formatWibDateTime, Paginated, Pagination, StatusBadge } from '../rt-finance/shared';

type Resident = { id: number; name: string; resident_status: string };
type Occupancy = { id: number; resident?: Resident; started_at: string; ended_at: string | null; resident_status: string; is_active: boolean };
type House = { id: number; number: string; block: string | null; status: string; notes: string | null; active_occupancies: Occupancy[]; occupancies: Occupancy[]; unpaid_bills_count: number; created_at?: string; updated_at?: string };

export default function HousesIndex({ houses, residents, filters }: { houses: Paginated<House>; residents: Resident[]; filters: Record<string, string> }) {
    const [editing, setEditing] = useState<House | null>(null);
    const [assigning, setAssigning] = useState<House | null>(null);
    const [detail, setDetail] = useState<House | null>(null);
    const [open, setOpen] = useState(false);
    const form = useForm({ number: '', block: '', status: 'tidak_dihuni', notes: '' });
    const occupancyForm = useForm({ resident_id: '', started_at: new Date().toISOString().slice(0, 10), ended_at: '', resident_status: 'tetap' });

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        editing ? form.patch(update.url(editing.id), options) : form.post(store.url(), options);
    }

    function submitOccupancy(event: FormEvent) {
        event.preventDefault();
        if (!assigning) return;
        occupancyForm.post(assignResident.url(assigning.id), { preserveScroll: true, onSuccess: () => setAssigning(null) });
    }

    function startEdit(house: House) {
        setEditing(house);
        form.setData({ number: house.number, block: house.block ?? '', status: house.status, notes: house.notes ?? '' });
        setOpen(true);
    }

    return (
        <>
            <Head title="Rumah" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Rumah</h1>
                        <p className="text-sm text-muted-foreground">Status hunian dan riwayat penghuni.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setEditing(null); form.reset(); form.setData('status', 'tidak_dihuni'); }}><Plus className="size-4" />Tambah</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={submit} className="grid gap-4">
                                <DialogHeader><DialogTitle>{editing ? 'Ubah rumah' : 'Tambah rumah'}</DialogTitle></DialogHeader>
                                <div className="grid gap-3">
                                    <div className="grid gap-2"><Label>Nomor rumah</Label><Input value={form.data.number} onChange={(e) => form.setData('number', e.target.value)} required /></div>
                                    <div className="grid gap-2"><Label>Blok</Label><Input value={form.data.block} onChange={(e) => form.setData('block', e.target.value)} /></div>
                                    <div className="grid gap-2">
                                        <Label>Status</Label>
                                        <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dihuni">Dihuni</SelectItem>
                                                <SelectItem value="tidak_dihuni">Tidak dihuni</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter><Button disabled={form.processing}>{form.processing ? 'Menyimpan...' : 'Simpan'}</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar rumah</CardTitle>
                        <DebouncedSearchInput url={index.url()} filters={filters} placeholder="Cari nomor / blok" />
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nomor</TableHead>
                                    <TableHead>Blok</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Penghuni aktif</TableHead>
                                    <TableHead>Tunggakan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {houses.data.length === 0 ? <EmptyRow colSpan={6} /> : houses.data.map((house) => {
                                    const active = house.active_occupancies[0];
                                    return (
                                        <TableRow key={house.id} className="cursor-pointer" onClick={() => setDetail(house)}>
                                            <TableCell>{house.number}</TableCell>
                                            <TableCell>{house.block ?? '-'}</TableCell>
                                            <TableCell><StatusBadge value={house.status} /></TableCell>
                                            <TableCell>{active?.resident?.name ?? '-'}</TableCell>
                                            <TableCell>{house.unpaid_bills_count}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); startEdit(house); }}><Edit className="size-4" /></Button>
                                                    <Button size="icon-sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setAssigning(house); }}><UserPlus className="size-4" /></Button>
                                                    {active && <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); router.patch(endOccupancy.url({ house: house.id, occupancy: active.id }), {}, { preserveScroll: true }); }}>Akhiri</Button>}
                                                    <ConfirmDeleteButton
                                                        title="Hapus rumah?"
                                                        description={`Rumah ${house.number} akan dihapus dari data.`}
                                                        onConfirm={() => router.delete(destroy.url(house.id), { preserveScroll: true })}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <Pagination links={houses.links} />
                    </CardContent>
                </Card>

                <Dialog open={assigning !== null} onOpenChange={(value) => !value && setAssigning(null)}>
                    <DialogContent>
                        <form onSubmit={submitOccupancy} className="grid gap-4">
                            <DialogHeader><DialogTitle>Tetapkan penghuni</DialogTitle></DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label>Penghuni</Label>
                                    <Select value={occupancyForm.data.resident_id} onValueChange={(value) => occupancyForm.setData('resident_id', value)}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Pilih penghuni" /></SelectTrigger>
                                        <SelectContent>{residents.map((resident) => <SelectItem key={resident.id} value={String(resident.id)}>{resident.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Mulai tinggal</Label><Input type="date" value={occupancyForm.data.started_at} onChange={(e) => occupancyForm.setData('started_at', e.target.value)} /></div>
                                <div className="grid gap-2">
                                    <Label>Status saat tinggal</Label>
                                    <Select value={occupancyForm.data.resident_status} onValueChange={(value) => occupancyForm.setData('resident_status', value)}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tetap">Tetap</SelectItem>
                                            <SelectItem value="kontrak">Kontrak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter><Button disabled={occupancyForm.processing}>{occupancyForm.processing ? 'Menyimpan...' : 'Simpan'}</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                {detail && (
                    <DetailDialog
                        title={`Rumah ${detail.number}`}
                        open={detail !== null}
                        onOpenChange={(value) => !value && setDetail(null)}
                        fields={[
                            ['Nomor', detail.number],
                            ['Blok', detail.block ?? '-'],
                            ['Status', <StatusBadge value={detail.status} />],
                            ['Penghuni aktif', detail.active_occupancies[0]?.resident?.name ?? '-'],
                            ['Tunggakan', detail.unpaid_bills_count],
                            ['Dibuat', formatWibDateTime(detail.created_at)],
                            ['Diubah', formatWibDateTime(detail.updated_at)],
                        ]}
                    />
                )}
            </div>
        </>
    );
}
