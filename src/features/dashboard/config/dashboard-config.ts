/**
 * Dashboard Configuration
 * 
 * Konfigurasi role-based untuk kolom tabel dan toolbar actions.
 * Sesuai dengan dokumentasi API Dashboard E-Office ST/SK Dekan.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ColumnKey =
  | "namaPengaju"
  | "judulSurat"
  | "nomorSurat"
  | "tipeSurat"
  | "jenisSurat"
  | "tanggalSurat"
  | "status"
  | "actions";

export type ToolbarAction =
  | "search"
  | "filter_status"
  | "filter_date"
  | "toggle_type"  // Surat Masuk/Keluar
  | "ajukan_surat"
  | "buat_surat";

export type RoleScope = "DEPARTEMEN" | "FAKULTAS" | "UPA";

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  className?: string;
}

export interface RoleDashboardConfig {
  scope: RoleScope;
  hasInboxOutbox: boolean;
  toolbarActions: ToolbarAction[];
  columns: {
    inbox?: ColumnConfig[];   // Surat Masuk
    outbox?: ColumnConfig[];  // Surat Keluar
    default: ColumnConfig[];  // Untuk role tanpa inbox/outbox
  };
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

const COLUMN_DEFS: Record<ColumnKey, ColumnConfig> = {
  namaPengaju: { key: "namaPengaju", label: "Nama Pengaju", className: "w-[15%] truncate" },
  judulSurat: { key: "judulSurat", label: "Judul Surat", className: "w-[20%] truncate" },
  nomorSurat: { key: "nomorSurat", label: "Nomor Surat", className: "w-[10%] truncate" },
  tipeSurat: { key: "tipeSurat", label: "Tipe Surat", className: "w-[12%]" },
  jenisSurat: { key: "jenisSurat", label: "Jenis Surat", className: "w-[10%]" },
  tanggalSurat: { key: "tanggalSurat", label: "Tanggal Surat", className: "w-[12%]" },
  status: { key: "status", label: "Status", className: "w-[12%]" },
  actions: { key: "actions", label: "Aksi", className: "w-[9%]" },
};

// Helper untuk membuat array kolom
const cols = (...keys: ColumnKey[]): ColumnConfig[] =>
  keys.map(key => COLUMN_DEFS[key]);

// ============================================================================
// ROLE CONFIGURATIONS
// ============================================================================

export const DASHBOARD_CONFIG: Record<string, RoleDashboardConfig> = {
  // -------------------------------------------------------------------------
  // LINGKUP DEPARTEMEN (Tidak ada Surat Masuk/Keluar)
  // -------------------------------------------------------------------------

  MAHASISWA: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date", "ajukan_surat"],
    columns: {
      default: cols("judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  DOSEN: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date", "ajukan_surat"],
    columns: {
      default: cols("judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  PENGAJU: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date", "ajukan_surat"],
    columns: {
      default: cols("judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  KAPRODI: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date"],
    columns: {
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  ADMIN_PRODI: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date"],
    columns: {
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  KADEP: {
    scope: "DEPARTEMEN",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date"],
    columns: {
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  // -------------------------------------------------------------------------
  // LINGKUP FAKULTAS (Ada Surat Masuk/Keluar)
  // -------------------------------------------------------------------------

  ADMIN_FAKULTAS: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "tanggalSurat", "status", "actions"),
    },
  },

  DEKAN: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  WADEK_1: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  WADEK_2: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  MANAJER_TU: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  SUPERVISOR_AKADEMIK: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  SUPERVISOR_SUMBER_DAYA: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  STAF_AKADEMIK: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "buat_surat", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  STAF_SUMBER_DAYA: {
    scope: "FAKULTAS",
    hasInboxOutbox: true,
    toolbarActions: ["toggle_type", "buat_surat", "search", "filter_status", "filter_date"],
    columns: {
      inbox: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      outbox: cols("judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
      default: cols("namaPengaju", "judulSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },

  // -------------------------------------------------------------------------
  // LINGKUP UPA (Dashboard khusus)
  // -------------------------------------------------------------------------

  UPA: {
    scope: "UPA",
    hasInboxOutbox: false,
    toolbarActions: ["search", "filter_status", "filter_date"],
    columns: {
      default: cols("judulSurat", "nomorSurat", "tipeSurat", "jenisSurat", "tanggalSurat", "status", "actions"),
    },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mendapatkan konfigurasi dashboard berdasarkan role
 */
export function getDashboardConfig(role: string): RoleDashboardConfig {
  const normalizedRole = role.toUpperCase();
  return DASHBOARD_CONFIG[normalizedRole] || DASHBOARD_CONFIG.MAHASISWA;
}

/**
 * Mendapatkan kolom berdasarkan role dan tipe (masuk/keluar)
 */
export function getColumnsForRole(role: string, type?: "masuk" | "keluar"): ColumnConfig[] {
  const config = getDashboardConfig(role);

  if (config.hasInboxOutbox && type) {
    return type === "masuk"
      ? (config.columns.inbox || config.columns.default)
      : (config.columns.outbox || config.columns.default);
  }

  return config.columns.default;
}

/**
 * Cek apakah role memiliki aksi tertentu
 */
export function hasToolbarAction(role: string, action: ToolbarAction): boolean {
  const config = getDashboardConfig(role);
  return config.toolbarActions.includes(action);
}
