import TindeqSessionDetail from "@/app/components/TindeqSessionDetail";

type PageProps = {
  params: Promise<{ athleteId: string; sessionId: string }>;
  searchParams: Promise<{ duplicate?: string }>;
};

export default async function AthleteRepeatersDetailPage({ params, searchParams }: PageProps) {
  const [{ athleteId, sessionId }, query] = await Promise.all([params, searchParams]);
  return (
    <TindeqSessionDetail
      sessionId={sessionId}
      expectedAthleteId={athleteId}
      duplicate={query.duplicate === "1"}
    />
  );
}
