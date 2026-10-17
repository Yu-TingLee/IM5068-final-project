# Manual test

One walkthrough of the whole referral loop, then a few error checks.

## Setup

```bash
cd server
rm -f data.db
uv run python -m app.cli create-store DAAN 大安旅店 --charity 家扶基金會   # copy the setup code it prints
uv run uvicorn app.main:app --port 8000
```

In a second terminal: `cd client && npm run dev`, then open http://localhost:5173.

Use three windows: **Store**, **A** (normal window) and **B** (private window).

## Walkthrough

- [x] **Store:** Home → 店家專區 → 首次設定: `DAAN`, the setup code, a new password. The dashboard shows a 6-digit 櫃台驗證碼.
- [x] **A:** Register `user123` / `user123`.
- [x] **A:** Home → 到店領見面禮, enter the Store's code. You get a NT$50 coupon.
- [x] **A:** 我的優惠券 → 我要使用, enter the code. It says 專屬推薦碼已解鎖.
- [x] **A:** 我的推薦碼 → copy the share text.
- [x] **B:** Register `ming` / `小明`, open the link from A's share text, claim. You get a NT$100 coupon.
- [x] **B:** 我的優惠券 → 我要使用, enter the code. It says 推薦人已收到.
- [x] **A:** 我的優惠券 has a NT$25 coupon.
- [x] **Store:** the dashboard shows 總核銷折價券 2 筆, NT$150 total.

## Error checks

- [x] A wrong 櫃台驗證碼 shows 驗證碼錯誤或已過期.
- [x] **A** claiming their own code shows 這是您自己的推薦碼.
- [x] **B** claiming A's code a second time shows 已經領取過.
- [x] Signing in with a wrong password shows 帳號或密碼錯誤.
- [x] With the server stopped, pages show 伺服器目前未開啟.

## Results

| Date | Who | Result |
| --- | --- | --- |
| 2026-10-18 | Yu-Ting Lee | Full walkthrough and all error checks passed locally. |
