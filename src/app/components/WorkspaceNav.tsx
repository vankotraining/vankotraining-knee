"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./WorkspaceNav.module.css";

const items = [
  { href: "/", label: "Klienti", matches: (path: string) => path === "/" },
  { href: "/clinical/exercises", label: "Clinical Map", matches: (path: string) => path.startsWith("/clinical") },
  { href: "/tindeq", label: "Tindeq", matches: (path: string) => path === "/tindeq" },
  { href: "/tindeq/reports", label: "Reporty", matches: (path: string) => path.startsWith("/tindeq/reports") },
];

export default function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Hlavní pracovní prostory">
      <div className={styles.inner}>
        {items.map((item) => {
          const active = item.matches(pathname);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? `${styles.link} ${styles.active}` : styles.link}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
