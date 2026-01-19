import { Card } from "@/components/ui/card";
import NomoringTable from "@/features/penomoran/components/numbering-table";

export default function NomorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nomor</h1>

      <Card>
        <NomoringTable />
      </Card>
    </div>
  );
}
