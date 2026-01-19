import SubmissionForm from "@/features/pengajuan/components/forms/submission-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TambahPengajuanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pengajuan">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tambah Pengajuan</h1>
      </div>

      <SubmissionForm />
    </div>
  );
}
