import TindeqSessionDetail from "@/app/components/TindeqSessionDetail";

type PageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ duplicate?: string }>;
};

export default async function RepeatersDetailPage({ params, searchParams }: PageProps) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  return <TindeqSessionDetail sessionId={sessionId} duplicate={query.duplicate === "1"} />;
}
