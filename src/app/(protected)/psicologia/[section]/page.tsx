import { TechnicalSection } from "@/components/technical-module";

export default async function PsychologySectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  return <TechnicalSection area="PSICOLOGIA" section={section} searchParams={query} />;
}
