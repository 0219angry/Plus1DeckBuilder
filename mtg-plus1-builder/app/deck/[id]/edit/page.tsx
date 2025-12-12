// app/deck/[id]/edit/page.tsx
import { getDeck } from "@/app/actions/deck";
import BuilderPage from "@/components/BuilderPage";
import { notFound, redirect } from "next/navigation";

export default async function EditDeckPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }, 
  searchParams: { key?: string } 
}) {
  const { id } = params;
  const key = searchParams.key;

  // キーがない場合は閲覧ページへ飛ばす
  if (!key) {
    redirect(`/deck/${id}`);
  }

  // データ取得
  const deckData = await getDeck(id);

  if (!deckData) {
    return notFound();
  }

  // 取得したデータを初期値として渡す
  return (
    <BuilderPage 
      initialData={deckData} 
      deckId={id} 
      editKey={key} 
    />
  );
}