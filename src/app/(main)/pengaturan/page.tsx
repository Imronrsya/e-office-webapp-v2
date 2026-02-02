import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Halaman pengaturan dalam pengembangan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
