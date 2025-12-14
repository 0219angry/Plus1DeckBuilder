export const PATHS = {  
  LOGIN_REQUIRED: "/?login=required",  
  HOME: "/",  
};  

export const QUERY_PARAMS = {  
  LOGIN: "login",  
  REQUIRED: "required",  
};  

export type VisibilityType = 'public' | 'private' | 'limit';

// 視認性ごとのスタイル定義
export const VISIBILITY_STYLES: Record<VisibilityType, string> = {
  public: 'bg-emerald-900/30 border-emerald-700 text-emerald-100',
  private: 'bg-red-900/40 border-red-800 text-red-100',
  limit: 'bg-amber-900/30 border-amber-700 text-amber-100',
};

// 表示ラベル（必要に応じて日本語化などもしやすくなります）
export const VISIBILITY_LABELS: Record<VisibilityType, string> = {
  public: 'Public',
  private: 'Private',
  limit: 'Limited',
};