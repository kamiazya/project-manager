/**
 * Test helper utilities for infrastructure layer tests
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

/**
 * Get a valid ULID by index (0-7)
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
  ]
  return ulids[index % ulids.length] as string
}
