import PengajuanTableView from "@/features/pengajuan/components/tables/pengajuan-table-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PengajuanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pengajuan</h1>
        <Link href="/pengajuan/tambah">
          <Button>+ Tambah Pengajuan</Button>
        </Link>
      </div>

      <PengajuanTableView />
    </div>
  );
}
