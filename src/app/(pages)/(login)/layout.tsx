import LogOutButton from "@/components/header/logOutButton";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <LogOutButton />
      {children}
    </div>
  );
}
