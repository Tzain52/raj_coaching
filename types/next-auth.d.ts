import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      classId?: string | null;
      class?: {
        id: string;
        name: string;
        displayOrder: number;
      } | null;
    };
  }

  interface User {
    role: UserRole;
    classId?: string | null;
  }
}
