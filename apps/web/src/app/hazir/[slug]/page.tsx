import { PickupBoard } from "@/components/pickup-board";

export const metadata = {
  title: "Hazır siparişler",
  robots: { index: false, follow: false },
};

export default async function PickupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PickupBoard slug={slug} />;
}
