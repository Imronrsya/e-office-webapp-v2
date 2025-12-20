import { useEffect, useState } from "react";
import { AxiosService } from "@/utils/axios";
import { AxiosResponse } from "axios";
import { APIResponse, Mahasiswa, Pegawai, SuratMasuk, User } from "@/utils/data";
import { ERole } from "@/access";
import { useUserMahasiswa } from "@/hooks/fetchUser";


export function useCurrentKaprodi(userState: ReturnType<typeof useUserMahasiswa>) {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(true);
  const [data, setData] = useState<User | null>(null);
  const axios = new AxiosService();

  useEffect(() => {
    async function load() {
      // sequential hook pattern
      if (userState.isLoading && userState.data == null) {
        return;
      }

      try {
        setLoading(true);

        let stringCodeDepartemen = userState.data?.nim.substring(0, 6);

        const res : AxiosResponse<APIResponse<Array<User>>> = await axios.get(`/v1/pegawai/prodi/23/${stringCodeDepartemen}`);
        const kaprodi = res.data.data;

        setData(kaprodi[0]);
      } catch (e: any) {
        console.log(e);
        setError(e);
      } finally {
        setLoading(false);
      }

      return () => {
        
      };
    }

    async function cleanup() {

    }

    load();

    // return cleanup;
  }, [userState.data]);

  return { 
    data: data, 
    isLoading: isLoading,
    error: error
  };
}
