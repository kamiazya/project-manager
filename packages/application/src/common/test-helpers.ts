/**
 * Test helper utilities for generating valid ULID values
 */

/**
 * Valid ULID examples for testing
 * ULIDs are 26 characters long using Crockford's Base32 alphabet
 */
export const VALID_ULID_1 = '01ARZ3NDEKTSV4RRFFQ69G5FAV'
export const VALID_ULID_2 = '01BX5ZZKBKACTAV9WEVGEMMVS0'
export const VALID_ULID_3 = '01HH3KGVHZH7JVWPN1M8QFJR7A'
export const VALID_ULID_4 = '01J6QWC8CFNQZ2KTGF7ZJR9PJD'
export const VALID_ULID_5 = '01J6QWC8CFNQZ2KTGF7ZJR9PJE'
export const VALID_ULID_6 = '01J6QWC8CFNQZ2KTGF7ZJR9PJF'
export const VALID_ULID_7 = '01J6QWC8CFNQZ2KTGF7ZJR9PJG'
export const VALID_ULID_8 = '01J6QWC8CFNQZ2KTGF7ZJR9PJH'
export const VALID_ULID_9 = '01J6QWC8CFNQZ2KTGF7ZJR9PJJ'
export const VALID_ULID_10 = '01J6QWC8CFNQZ2KTGF7ZJR9PJK'

/**
 * Invalid ID examples for testing error cases
 */
export const INVALID_ID_TOO_SHORT = '12345'
export const INVALID_ID_TOO_LONG = '01ARZ3NDEKTSV4RRFFQ69G5FAVEXTRA'
export const INVALID_ID_HEX_8 = '12345678' // Old hex format
export const INVALID_ID_CONTAINS_LOWERCASE = '01arz3ndektsv4rrffq69g5fav' // ULID must be uppercase
export const INVALID_ID_CONTAINS_INVALID_CHARS = '01ARZ3NDEKTSV4RRFFQ69G5FAI' // Contains 'I' which is not in Base32
export const INVALID_ID_CONTAINS_SPECIAL = '01ARZ3NDEKTSV4RRFFQ69G5F@V' // Contains special character

/**
 * Get a valid ULID by index (0-9)
 */
export function getValidUlidByIndex(index: number): string {
  const ulids = [
    VALID_ULID_1,
    VALID_ULID_2,
    VALID_ULID_3,
    VALID_ULID_4,
    VALID_ULID_5,
    VALID_ULID_6,
    VALID_ULID_7,
    VALID_ULID_8,
    VALID_ULID_9,
    VALID_ULID_10,
  ]
  return ulids[index % ulids.length] as string
}
