import Link from "next/link";
import KneeApp from "./components/KneeApp";

export default function Home() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 16px 0",
        }}
      >
        <Link
          href="/tindeq"
          style={{
            border: "1px solid rgba(105, 216, 173, 0.45)",
            borderRadius: 999,
            color: "inherit",
            fontWeight: 700,
            padding: "9px 14px",
            textDecoration: "none",
          }}
        >
          Tindeq Repeaters
        </Link>
      </div>
      <KneeApp />
    </>
  );
}
