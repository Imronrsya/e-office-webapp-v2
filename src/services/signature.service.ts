import { api } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SavedSignature {
  id: string;
  type: "UPLOAD" | "HANDWRITING";
  fileUrl: string;
  fileName: string;
  alias: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SavedSignatureListResponse {
  data: SavedSignature[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// SIGNATURE SERVICE
// ============================================================================

export const signatureService = {
  /**
   * Get all saved signatures for current user
   */
  async getMySavedSignatures(): Promise<SavedSignature[]> {
    try {
      const response = await api.get<ApiResponse<SavedSignatureListResponse>>(
        "/api/signatures/me"
      );
      if (response.data.success && response.data.data) {
        return response.data.data.data;
      }
      return [];
    } catch (error) {
      console.error("Failed to get saved signatures:", error);
      return [];
    }
  },

  /**
   * Upload and save a new signature
   */
  async uploadSignature(
    signatureData: string,
    method: "UPLOAD" | "DRAW",
    alias?: string
  ): Promise<SavedSignature | null> {
    try {
      // Convert base64 to blob
      const response = await fetch(signatureData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append("file", blob, `signature-${Date.now()}.png`);
      formData.append("method", method === "DRAW" ? "CANVAS" : "UPLOAD");
      if (alias) {
        formData.append("alias", alias);
      }

      const apiResponse = await api.post<ApiResponse<SavedSignature>>(
        "/api/signatures/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (apiResponse.data.success && apiResponse.data.data) {
        return apiResponse.data.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to upload signature:", error);
      throw error;
    }
  },

  /**
   * Delete a saved signature
   */
  async deleteSignature(signatureId: string): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<unknown>>(
        `/api/signatures/${signatureId}`
      );
      return response.data.success;
    } catch (error) {
      console.error("Failed to delete signature:", error);
      return false;
    }
  },

  /**
   * Update signature alias
   */
  async updateAlias(signatureId: string, alias: string): Promise<boolean> {
    try {
      const response = await api.patch<ApiResponse<unknown>>(
        `/api/signatures/${signatureId}`,
        { alias }
      );
      return response.data.success;
    } catch (error) {
      console.error("Failed to update signature alias:", error);
      return false;
    }
  },
};
