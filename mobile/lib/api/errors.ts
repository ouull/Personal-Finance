export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_TYPE_MISMATCH: 'CATEGORY_TYPE_MISMATCH',
  CASH_CREATION_FORBIDDEN: 'CASH_CREATION_FORBIDDEN',
  SYSTEM_ACCOUNT_DELETION_FORBIDDEN: 'SYSTEM_ACCOUNT_DELETION_FORBIDDEN',
};

const idErrorMap: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'Sesi Anda telah berakhir, silakan masuk kembali.',
  [ErrorCodes.FORBIDDEN]: 'Anda tidak memiliki akses.',
  [ErrorCodes.VALIDATION_ERROR]: 'Terdapat kesalahan pada data yang dimasukkan.',
  [ErrorCodes.ACCOUNT_NOT_FOUND]: 'Akun tidak ditemukan.',
  [ErrorCodes.CATEGORY_NOT_FOUND]: 'Kategori tidak ditemukan.',
  [ErrorCodes.CATEGORY_TYPE_MISMATCH]: 'Tipe kategori tidak sesuai.',
  [ErrorCodes.CASH_CREATION_FORBIDDEN]: 'Tidak dapat membuat akun tunai manual.',
  [ErrorCodes.SYSTEM_ACCOUNT_DELETION_FORBIDDEN]: 'Akun sistem tidak dapat dihapus.',
};

const enErrorMap: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'Your session has expired, please log in again.',
  [ErrorCodes.FORBIDDEN]: 'You do not have access.',
  [ErrorCodes.VALIDATION_ERROR]: 'Validation error occurred.',
  [ErrorCodes.ACCOUNT_NOT_FOUND]: 'Account not found.',
  [ErrorCodes.CATEGORY_NOT_FOUND]: 'Category not found.',
  [ErrorCodes.CATEGORY_TYPE_MISMATCH]: 'Category type mismatch.',
  [ErrorCodes.CASH_CREATION_FORBIDDEN]: 'Cannot create manual cash accounts.',
  [ErrorCodes.SYSTEM_ACCOUNT_DELETION_FORBIDDEN]: 'System accounts cannot be deleted.',
};

export function getLocalizedError(errorCode: string, lang: 'id' | 'en' = 'id'): string {
  if (lang === 'en') {
    return enErrorMap[errorCode] || 'An unknown error occurred.';
  }
  return idErrorMap[errorCode] || 'Terjadi kesalahan sistem.';
}
