import { getDeck } from "@/app/actions/deck";
import BuilderPage from "@/components/BuilderPage";
import { notFound, redirect } from "next/navigation";

// ■ 修正: 両方 Promise 型にする
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
};

export default async function EditDeckPage({ params, searchParams }: PageProps) {
  // ■ 修正: 両方 await する
  const { id } = await params;
  const { key } = await searchParams;

  if (!key) {
    redirect(`/deck/${id}`);
  }

  const deckData = await getDeck(id);

  if (!deckData) {
    return notFound();
  }

  return (
    <BuilderPage 
      initialData={deckData} 
      deckId={id} 
      editKey={key} 
    />
  );
}