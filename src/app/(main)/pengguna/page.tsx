import UserTable from "@/features/users/components/user-table";
import { Button } from "@/components/ui/button";

export default function PenggunaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pengguna</h1>
        <Button>+ Tambah Pengguna</Button>
      </div>

      <UserTable />
    </div>
  );
}
