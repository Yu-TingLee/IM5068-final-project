const MESSAGES = {
  server_offline: '伺服器目前未開啟，請稍後再試。',
  not_signed_in: '請先登入。',
  wrong_credentials: '帳號或密碼錯誤。',
  account_taken: '此帳號已被使用。',
  display_name_taken: '此名稱已被使用。',
  invalid_account: '帳號需為 3–20 個小寫英文、數字或底線。',
  invalid_display_name: '顯示名稱需為 1–20 個字，且不可包含「/」。',
  weak_password: '密碼至少需要 8 個字元。',
  store_not_found: '找不到這個店家代碼。',
  store_not_set_up: '此店家尚未完成首次設定，請切換到「首次設定」。',
  invalid_setup_code: '店家代碼或設定碼錯誤，或設定碼已使用過。',
  wrong_counter_code: '驗證碼錯誤或已過期，請向店家確認最新的驗證碼。',
  referral_code_not_found: '找不到這個推薦碼，請確認是否輸入正確。',
  own_referral_code: '這是您自己的推薦碼喔！請分享給好友 ❤️',
  already_claimed: '您已經領取過這間店家的新客優惠券囉！',
  wallet_full: '您的優惠券匣已有 15 張未使用折價券，請先到店使用後再領取。',
  coupon_not_found: '找不到這張優惠券。',
  coupon_not_usable: '此優惠券已使用或已過期。',
};

export function errorMessage(error) {
  return MESSAGES[error?.code] ?? '發生錯誤，請稍後再試。';
}
