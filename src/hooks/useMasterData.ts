"use client";

import { useEffect, useState } from "react";
import { getProdiList, getDepartemenList, ProgramStudi, DepartemenWithProdi } from "@/services/masterData.service";

/**
 * Hook to fetch and cache program studi list
 */
export function useProdiList() {
  const [data, setData] = useState<ProgramStudi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const prodiList = await getProdiList();
        if (isMounted) {
          setData(prodiList);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch prodi list"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}

/**
 * Hook to fetch and cache department list with prodi
 */
export function useDepartemenList() {
  const [data, setData] = useState<DepartemenWithProdi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const deptList = await getDepartemenList();
        if (isMounted) {
          setData(deptList);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch departemen list"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}

/**
 * Hook to get prodi list filtered by department
 */
export function useProdiListByDepartemen(departemenId?: string) {
  const { data: allProdi, isLoading, error } = useProdiList();

  const filteredData = departemenId
    ? allProdi.filter((prodi) => prodi.departemenId === departemenId)
    : allProdi;

  return { data: filteredData, isLoading, error };
}
