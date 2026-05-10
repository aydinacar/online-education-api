# Online Education - Backend

Express + TypeScript + Drizzle + PostgreSQL + Zod ile online eğitim platformu API'si.

## Gereksinimler

- Node.js 20+
- PostgreSQL 14+
- npm / pnpm / yarn

## Kurulum

```bash
# Bağımlılıklar
npm install

# Env değişkenlerini ayarla
cp .env.example .env
# .env içindeki DATABASE_URL ve JWT secret'ları düzenle

# DB schema'yı oluştur
npm run db:generate    # SQL migration'ları üret
npm run db:migrate     # Migration'ları çalıştır
# veya geliştirme için: npm run db:push

# Seed (opsiyonel - admin user + örnek kategoriler)
npm run db:seed

# Dev server
npm run dev
```

Server `http://localhost:4000/api` adresinde başlar.

## Komutlar

| Komut                 | Açıklama                                |
| --------------------- | --------------------------------------- |
| `npm run dev`         | tsx watch ile development server        |
| `npm run build`       | TypeScript'i `dist/` altına derle       |
| `npm start`           | Production server (`dist/server.js`)    |
| `npm run type-check`  | TS tip kontrolü (emit yok)              |
| `npm run lint`        | ESLint                                  |
| `npm run format`      | Prettier                                |
| `npm run db:generate` | Schema değişikliğinden migration üret   |
| `npm run db:migrate`  | Migration'ları DB'ye uygula             |
| `npm run db:push`     | Schema'yı direkt DB'ye push et (dev)    |
| `npm run db:studio`   | Drizzle Studio (web tabanlı DB browser) |
| `npm run db:seed`     | Admin user + örnek kategorileri yükle   |

## Klasör Yapısı

```
src/
├── config/        # env, database, constants
├── db/
│   ├── schema/    # Drizzle table tanımları + relations
│   └── migrations/ # drizzle-kit'in ürettiği SQL
├── middleware/    # auth, role, validate, error, ratelimit, logger
├── routes/        # Endpoint -> middleware -> controller bağlama
├── controllers/   # HTTP katmanı: req'i parse et, service'i çağır
├── services/      # Business logic, DB ile konuşan tek katman
├── validations/   # Zod şemaları (body/query/params)
├── types/         # ApiResponse, express.d.ts
├── utils/         # ApiError, asyncHandler, password, vb.
├── app.ts         # Express app setup
└── server.ts      # http.listen + graceful shutdown
```

İstek akışı: `route -> validate -> authenticate -> requireRole -> controller -> service -> db`

## Auth

JWT access + refresh token. Refresh token'lar DB'de tutulur (revoke edilebilir).

| Endpoint                  | Açıklama                        |
| ------------------------- | ------------------------------- |
| `POST /api/auth/register` | Yeni kullanıcı                  |
| `POST /api/auth/login`    | Giriş - access + refresh döner  |
| `POST /api/auth/refresh`  | Token yenileme (rotation)       |
| `POST /api/auth/logout`   | Refresh token'ı revoke et       |
| `GET /api/auth/me`        | Mevcut kullanıcı (auth gerekli) |

Response formatı:

```json
{ "success": true, "data": {...}, "message": "...", "meta": {...} }
```

Hata:

```json
{ "success": false, "message": "...", "errors": {...}, "statusCode": 400 }
```

## Yeni Endpoint Eklemek

1. `db/schema/` altına tablo (gerekiyorsa)
2. `validations/` altına Zod şeması
3. `services/` altına iş mantığı
4. `controllers/` altına HTTP handler
5. `routes/` altına endpoint tanımı
6. `routes/index.ts` içinde mount et

## Notlar

- Refresh token'lar DB'de saklanıyor, revoke edilebilir, şifre değiştiğinde tüm oturumlar sonlanır
- Kursların `studentCount`, `rating`, `reviewCount` gibi sayaçları denormalize - okuma performansı için
- Şu an logger basit `console` wrapper'ı; ileride Pino/Winston'a geçmek için sadece `utils/logger.ts` değişir
- Upload ve email entegrasyonu yok - eklenince `services/storage.service.ts` ve `services/email.service.ts` olarak ayrılacak
