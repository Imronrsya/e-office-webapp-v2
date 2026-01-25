// Role constants sesuai dengan API backend
export const ROLES = {
    // Lingkup Departemen
    MAHASISWA: "MAHASISWA",
    DOSEN: "DOSEN",
    KAPRODI: "KAPRODI",
    ADMIN_PRODI: "ADMIN_PRODI",
    KADEP: "KADEP",

    // Lingkup Fakultas
    ADMIN_FAKULTAS: "ADMIN_FAKULTAS",
    DEKAN: "DEKAN",
    WADEK_1: "WADEK_1",
    WADEK_2: "WADEK_2",
    MANAJER_TU: "MANAJER_TU",
    SUPERVISOR_AKADEMIK: "SUPERVISOR_AKADEMIK",
    SUPERVISOR_SUMBER_DAYA: "SUPERVISOR_SUMBER_DAYA",
    STAF_AKADEMIK: "STAF_AKADEMIK",
    STAF_SUMBER_DAYA: "STAF_SUMBER_DAYA",

    // Lingkup UPA
    UPA: "UPA",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================================================
// EMAIL TO ROLE MAPPING (Fallback ketika /me tidak tersedia)
// Sesuai dengan seed data backend e-office-api-v2
// ============================================================================

const EMAIL_TO_ROLE: Record<string, string> = {
    // Superadmin
    "superadmin@fsm.undip.ac.id": "SUPERADMIN",

    // Lingkup Departemen
    "ahmad.budi@students.undip.ac.id": "MAHASISWA",
    "dewi.sartika@students.undip.ac.id": "MAHASISWA",
    "raden.satrio@lecturer.undip.ac.id": "DOSEN",
    "kaprodi.if@undip.ac.id": "KAPRODI",
    "admin.prodi.if@undip.ac.id": "ADMIN_PRODI",
    "kadep.if@undip.ac.id": "KADEP",

    // Lingkup Fakultas
    "admin.fakultas@fsm.undip.ac.id": "ADMIN_FAKULTAS",
    "dekan@fsm.undip.ac.id": "DEKAN",
    "wadek1@fsm.undip.ac.id": "WADEK_1",
    "wadek2@fsm.undip.ac.id": "WADEK_2",
    "manajer.tu@fsm.undip.ac.id": "MANAJER_TU",
    "spv.akademik@fsm.undip.ac.id": "SUPERVISOR_AKADEMIK",
    "spv.sumberdaya@fsm.undip.ac.id": "SUPERVISOR_SUMBER_DAYA",
    "staf.akademik1@fsm.undip.ac.id": "STAF_AKADEMIK",
    "staf.akademik2@fsm.undip.ac.id": "STAF_AKADEMIK",
    "staf.sumberdaya@fsm.undip.ac.id": "STAF_SUMBER_DAYA",
    "upa@fsm.undip.ac.id": "UPA",
};

/**
 * Fallback: Mendapatkan role dari email jika /me endpoint tidak tersedia
 */
export function getRoleByEmail(email: string): string {
    return EMAIL_TO_ROLE[email] || "MAHASISWA";
}

// Role labels untuk display
export const ROLE_LABELS: Record<string, string> = {
    MAHASISWA: "Mahasiswa",
    DOSEN: "Dosen",
    KAPRODI: "Ketua Program Studi",
    ADMIN_PRODI: "Admin Prodi",
    KADEP: "Ketua Departemen",
    ADMIN_FAKULTAS: "Admin Fakultas",
    DEKAN: "Dekan",
    WADEK_1: "Wakil Dekan 1",
    WADEK_2: "Wakil Dekan 2",
    MANAJER_TU: "Manajer TU",
    SUPERVISOR_AKADEMIK: "Supervisor Akademik",
    SUPERVISOR_SUMBER_DAYA: "Supervisor Sumber Daya",
    STAF_AKADEMIK: "Staf Akademik",
    STAF_SUMBER_DAYA: "Staf Sumber Daya",
    UPA: "Unit Pelaksana Akademik",
};

// Lingkup role untuk menentukan fitur yang tersedia
export const ROLE_SCOPE = {
    DEPARTEMEN: ["MAHASISWA", "DOSEN", "KAPRODI", "ADMIN_PRODI", "KADEP"],
    FAKULTAS: [
        "ADMIN_FAKULTAS",
        "DEKAN",
        "WADEK_1",
        "WADEK_2",
        "MANAJER_TU",
        "SUPERVISOR_AKADEMIK",
        "SUPERVISOR_SUMBER_DAYA",
        "STAF_AKADEMIK",
        "STAF_SUMBER_DAYA"
    ],
    UPA: ["UPA"],
} as const;

export function getRoleLabel(role: string): string {
    if (!role) return "";
    return ROLE_LABELS[role.toUpperCase()] || role;
}

export function isRoleFakultas(role: string): boolean {
    return ROLE_SCOPE.FAKULTAS.includes(role.toUpperCase() as any);
}

export function isRoleDepartemen(role: string): boolean {
    return ROLE_SCOPE.DEPARTEMEN.includes(role.toUpperCase() as any);
}

export function isRoleUPA(role: string): boolean {
    return ROLE_SCOPE.UPA.includes(role.toUpperCase() as any);
}

// Role yang bisa mengajukan surat (Pengaju)
export function canSubmitLetter(role: string): boolean {
    return ["MAHASISWA", "DOSEN"].includes(role.toUpperCase());
}
