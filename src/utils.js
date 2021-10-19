/**
 * Utility functions for fast lookup and data type checking
 */

/**
 * Find an item in an array of objects by key and value
 * @ignore
 * @func util
 * @param {object[]} a The collection to iterate
 * @param {function} fn The filter function to find by
 * @returns {(object|undefined)}
 */
export const fastFind = (a, fn) => {
  let f
  const { length } = a
  for (let i = length - 1; i >= 0; i -= 1) {
    if (fn(a[i])) {
      f = a[i]
      break
    }
  }
  return f
}

/**
 * Check data is of specified data type, case-insensitive
 * @ignore
 * @func util
 * @param {*} data The item to type check
 * @param {string} dataType The data type to assert as
 * @returns {boolean}
 */
export const typeIs = (data, dataType) => {
  const test = Object.prototype.toString.call(data)
  const discoveredType = test.replace(/\[object /gi, '').replace(/\]/gi, '')
  return discoveredType.toLowerCase() === dataType.toLowerCase()
}
