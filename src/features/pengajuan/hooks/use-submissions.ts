"use client";

import { useState } from "react";

export function useSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      // Add your fetch logic here
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submissions,
    isLoading,
    fetchSubmissions,
  };
}
