export const fastFind = (array, key, id) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i][key] === id) {
      return array[i]
    }
  }
}

export const fastFilter = (array, fn) => {
  const final = []
  for (let i = 0; i < array.length; i++) {
    if (fn(array[i])) {
      final.push(array[i])
    }
  }
  return final
}
