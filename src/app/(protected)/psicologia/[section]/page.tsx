import { TechnicalSection } from "@/components/technical-module";

export default function PsychologySectionPage({
  params,
  searchParams,
}: {
  params: { section: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <TechnicalSection area="PSICOLOGIA" section={params.section} searchParams={searchParams} />;
}
