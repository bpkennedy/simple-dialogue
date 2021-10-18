/**
 * Utility functions for finding and iterating efficiently
 */

/**
 * Find an item in an array of objects by key and value
 * @ignore
 * @function
 * @param {string} array The collection to iterate
 * @param {number} key The object property key to find
 * @param {*} value The object property value to find
 * @returns {(object|undefined)}
 */
export const fastFind = (array, key, value) => {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i][key] === value) {
      return array[i]
    }
  }
  return undefined
}

/**
 * Filter an array of objects by a filter function
 * @ignore
 * @function
 * @param {string} array The collection to iterate
 * @param {function} fn The function to filter by
 * @returns {object[]}
 */
export const fastFilter = (array, fn) => {
  const final = []
  for (let i = 0; i < array.length; i += 1) {
    if (fn(array[i])) {
      final.push(array[i])
    }
  }
  return final
}
