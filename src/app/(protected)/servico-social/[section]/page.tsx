import { TechnicalSection } from "@/components/technical-module";

export default function SocialWorkSectionPage({
  params,
  searchParams,
}: {
  params: { section: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <TechnicalSection area="SERVICO_SOCIAL" section={params.section} searchParams={searchParams} />;
}
