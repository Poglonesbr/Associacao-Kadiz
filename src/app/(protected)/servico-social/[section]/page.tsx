import { TechnicalSection } from "@/components/technical-module";

export default async function SocialWorkSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  return <TechnicalSection area="SERVICO_SOCIAL" section={section} searchParams={query} />;
}
