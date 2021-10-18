/**
 * Utility functions for finding and iterating efficiently
 */

/**
 * Find an item in an array of objects by key and value
 * @ignore
 * @func util
 * @param {object[]} a The collection to iterate
 * @param {function} fn The filter function to find by
 * @returns {(object|undefined)}
 */
export default (a, fn) => {
  let f
  const { length } = a // eslint-disable-line no-eval
  for (let i = length - 1; i >= 0; i -= 1) {
    if (fn(a[i])) {
      f = a[i]
      break
    }
  }
  return f
}
