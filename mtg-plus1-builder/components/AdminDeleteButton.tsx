'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { deleteDeckAsAdmin } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export default function AdminDeleteButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

    setIsDeleting(true);
    const res = await deleteDeckAsAdmin(id);
    if (res.success) {
      // 成功したら画面リフレッシュ
      router.refresh(); 
    } else {
      alert('削除に失敗しました');
    }
    setIsDeleting(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
      title="削除"
    >
      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}