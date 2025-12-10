"use server";

export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  // サーバー側の環境変数を取得
  const correctPassword = process.env.ADMIN_PASSWORD;

  // 環境変数が設定されていない場合は常に拒否（安全策）
  if (!correctPassword) {
    console.error("ADMIN_PASSWORD is not set in environment variables.");
    return false;
  }

  // パスワードの一致確認
  return inputPassword === correctPassword;
}