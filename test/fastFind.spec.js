import { expect } from 'chai'
const { performance } = require('perf_hooks')
import fastFind from '../src/fastFind'

function average(array) {
  return array.reduce((a, b) => a + b) / array.length
}

describe('FastFind', function() {
  const COUNT = 100000
  const MESSAGE = 'test message for big dialogue 64789'
  let bigItems = []

  beforeEach(function() {
    for (let i = 0; i < COUNT; i += 1) {
      bigItems.push({
        id: i + 1,
        message: 'test message for big dialogue ' + i
      })
    }
  })

  afterEach(function() {
    bigItems.length = 0
  })

  it('should find item in object array quickly', () => {
    const fastRuns = []
    for (let i = 0;i < 100;i+=1) {
      const startTime1 = performance.now()
      fastFind(bigItems, i => i.message === MESSAGE)
      const endTime1 = performance.now()
      fastRuns.push(endTime1 - startTime1)
    }

    const slowRuns = []
    for (let i = 0;i < 100;i+=1) {
      const startTime2 = performance.now()
      bigItems.find(i => i.message === MESSAGE)
      const endTime2 = performance.now()
      slowRuns.push(endTime2 - startTime2)
    }

    expect(average(fastRuns)).to.be.lessThan(average(slowRuns))
  })

  it('should return undefined if object not found in array', () => {
    const testArray = [ { id: 1}, { id: 3}]

    expect(fastFind(bigItems, i => i.id === 1)).to.exist
    expect(fastFind(testArray, i => i.id === 2)).to.be.undefined
  })
})
