"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Change Password is now handled inside My Profile — redirect there
    router.replace("/employee/profile");
  }, [router]);

  return null;
}
