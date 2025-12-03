# ベースイメージ
FROM node:22-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存関係ファイルのコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードのコピー
COPY . .

# Next.jsはデフォルトでlocalhostのみリッスンするため、
# Docker外からアクセスできるように0.0.0.0を指定
ENV HOSTNAME "0.0.0.0"

# ポート公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]