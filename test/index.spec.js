import { expect } from 'chai'
import { interactWith, loadDialogue, clearDialogue } from '../src/index'

function stripPrompts(dialogue) {
  const clone = { ...dialogue }
  delete clone.prompts
  return clone
}

function malformedError(id) {
  return `simple-dialogue: malformed Dialogue object for dialogueId: ${id}.
      Please ensure your objects have the required fields.

      Example:
      {
        id: 1, // required number
        message: '', // required
        choices: [1,2,3], // optional, array of numbers
        next: 1 // required number, if no choices
        pre: () => {},  // optional
        preId: 1, // required number, if using pre
        post: () => {}, // optional
      }`
}

describe('Dialogue', function() {

  describe('when player does interactWith', function() {
    it('should get initial dialogue as index 0 of array', () => {
      const firstId = 1
      const dialogues = [
        {id: firstId, message: 'Would you like to take my quest?', choices: [2]},
        {id: 2, message: 'Sure will!', next: 3},
        {id: 3, message: 'Great, thank you!', next: null}
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      expect(stripPrompts(result)).to.eql(dialogues.find(d => d.id === firstId))
      clearDialogue('leonard')
    })

    it('should hydrate dialogue choices in the prompts field', () => {
      const dialogues = [
        {id: 1, message: 'Would you like to take my quest?', choices: [2]},
        {id: 2, message: 'Sure will!', next: 3}
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      const hydratedDialogue = {
        ...result,
        prompts: [dialogues.find(d => d.id === result.prompts[0].id)]
      }

      expect(result).to.eql(hydratedDialogue)
      clearDialogue('leonard')
    })

    it('should get the same dialogue if no choices are sent', function() {
      const dialogues = [
        {id: 1, message: 'Would you like to take my quest?', choices: [2]},
        {id: 2, message: 'Sure will!', next: 3},
        {id: 3, message: 'Great, thank you!', next: null}
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      expect(stripPrompts(result)).to.eql(dialogues.find(d => d.id === 1))
      const result2 = interactWith('leonard')
      expect(stripPrompts(result2)).to.eql(dialogues.find(d => d.id === 1))
      clearDialogue('leonard')
    })

    it('should return empty choices array if user loaded dialogue choices as empty', () => {
      const dialogues = [
        {id: 1, message: 'Would you like to take my quest?', choices: []},
        {id: 2, message: 'Sure will!', next: 3},
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      expect(stripPrompts(result)).to.eql(dialogues.find(d => d.id === 1))
    })

    it('should not go to next dialogue if choice\'s next is set to null or undefined', () => {
      const dialogues = [
        {id: 1, message: 'Would you like to get stuck in dialogue?', choices: [2]},
        {id: 2, message: 'Uh...', next: null},
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      const secondResult = interactWith('leonard', result.prompts[0].id)
      expect(stripPrompts(secondResult)).to.eql(dialogues.find(d => d.id === 1))
    })
  })

  describe('when player does interactWith with a choice', function() {
    it('should move the npc dialogue to the next dialogue', () => {
      const dialogues = [
        {id: 1, message: 'Would you like to take my quest?', choices: [2]},
        {id: 2, message: 'Sure will!', next: 3},
        {id: 3, message: 'Awesome, be back after you kill those twenty three chickens.', next: null}
      ]

      loadDialogue('leonard', dialogues)
      const result = interactWith('leonard')
      const secondResult = interactWith('leonard', result.prompts[0].id)
      expect(stripPrompts(secondResult)).to.eql(dialogues.find(d => d.id === result.prompts[0].next))
      clearDialogue('leonard')
    })

    it('should throw error if required Dialogue keys are missing', () => {
      const malformeds = {
        'choiceStrings': [{ id: 1, message: 'Strings instead of numbers for choices', choices: ['2'] }],
        'noId': [{ message: 'Strings instead of numbers for choices', choices: [2] }],
        'noMessage': [{ id: 1, choices: [2] }],
        'noRequiredNext': [{ id: 1, message: 'Strings instead of numbers for choices' }],
        'noPreIdWhenPre': [{ id: 1, message: 'Strings instead of numbers for choices', next: 3, pre: () => ({}) }],
      }

      for (const key of Object.keys(malformeds)) {
        expect(() => loadDialogue('dude', malformeds[key])).to.throw(malformedError(malformeds[key][0].id || 'undefined'))
        clearDialogue('dude')
      }
    })

    it('should return error message if character does not exist when calling loadDialogue', () => {
      loadDialogue('someRealGuy', [{ id: 1, message: 'Hello', next: 3 }])
      expect(() => interactWith('noExistsGuy')).to.throw('simple-dialog: No dialogue found for noExistsGuy. Did you use loadDialogue() to create some?')
      clearDialogue('someRealGuy')
    })

    it('should silently continue if character does not exist when calling clearDialogue', () => {
      loadDialogue('someRealGuy', [{ id: 1, message: 'Hello', next: 3 }])
      expect(() => clearDialogue('noExistsGuy')).not.to.throw
      clearDialogue('someRealGuy')
    })

    describe('when prereq is used', function() {
      it('should not show dialogue if prereq returns false', () => {
        let hasBrassKnuckles = false
        const hasTheKey = () => hasBrassKnuckles === true

        const dialogue = [
          {id: 1, message: `I ain't talking to you`, choices: [2]},
          {id: 2, pre: hasTheKey, preId: 4, message: 'Who do you work for!?', next: 3},
          {id: 3, message: `I work for Da Big Boss.`, next: 1},
          {id: 4, message: `I ain't tellin you nothin!`, next: 1}
        ]

        loadDialogue('goon', dialogue)
        const initial = interactWith('goon')
        const playerChoiceId = initial.prompts[0].id
        const playerFailPrereqId = initial.prompts[0].preId
        const demandResponse = interactWith('goon', playerChoiceId)
        expect(stripPrompts(demandResponse)).to.eql(dialogue.find(d => d.id === playerFailPrereqId))
        clearDialogue('goon')
      })

      it('should show next dialogue if prereq is true', () => {
        let hasBrassKnuckles = true
        const hasTheKey = () => hasBrassKnuckles === true

        const dialogue = [
          {id: 1, message: `I ain't talking to you`, choices: [2]},
          {id: 2, pre: hasTheKey, preId: 4, message: 'Who do you work for!?', next: 3},
          {id: 3, message: `I work for Da Big Boss.`, next: 1},
          {id: 4, message: `I ain't tellin you nothin!`, next: 1}
        ]

        loadDialogue('goon', dialogue)
        const initial = interactWith('goon')
        const playerChoiceId = initial.prompts[0].id
        const demandResponse = interactWith('goon', playerChoiceId)
        expect(stripPrompts(demandResponse)).to.eql(dialogue.find(d => d.id === initial.prompts[0].next))
        clearDialogue('goon')
      })
    })

    describe('when postreq is used', function() {
      it('should experience the postreq callback effects', () => {
        const originalPlayerMoney = 10
        const npcMoney = 50
        let expectedMoney
        const getNpcQuestMoney = () => expectedMoney = originalPlayerMoney + npcMoney

        const dialogue = [
          {id: 1, message: `You want some money?`, choices: [2,3]},
          {id: 2, message: 'Why, yes, thank you.', post: getNpcQuestMoney, next: 4},
          {id: 3, message: `I don't need your charity!`, next: 5},
          {id: 4, message: `Enjoy your money!`, next: null},
          {id: 5, message: `Gees, you try and help somebody...`, next: null}
        ]

        loadDialogue('johnny', dialogue)
        const initial = interactWith('johnny')
        const playerChoiceId = initial.prompts[0].id
        const offerResponse = interactWith('johnny', playerChoiceId)
        expect(stripPrompts(offerResponse)).to.eql(dialogue.find(d => d.id === initial.prompts[0].next))
        expect(expectedMoney).to.eql(originalPlayerMoney + npcMoney)
        clearDialogue('johnny')
      })
    })

    describe('when pre and post are used together', function() {
      it('should perform full example', () => {
        let johnnyRelationship = 60
        let playerXP = 2000
        let playerTookQuest = false

        const takeQuest = () => playerTookQuest = true
        const dislikePlayer = () => johnnyRelationship -= 10
        const isHighEnoughLevel = () => playerXP > 4000

        const dialogues = [
          {id: 1, message: `Would you like to take my quest?`, choices: [2, 3]},
          {id: 2, message: `Sure, I'll take it.`, pre: isHighEnoughLevel, preId: 5, post: takeQuest, next: 4},
          {id: 3, message: `Nah, not worth my time.`, post: dislikePlayer, next: 6},
          {id: 4, message: `Great! Go get me 300 chickens.`, next: null},
          {id: 5, message: `Hold up, come back after you've farmed a bit more.`, next: 1},
          {id: 6, message: `Thanks for nothing, buddy.`, next: null}
        ]

        loadDialogue('johnny', dialogues)
        const initial = interactWith('johnny')
        const tryAccept = interactWith('johnny', initial.prompts[0].id)
        expect(stripPrompts(tryAccept)).to.eql(dialogues.find(d => d.id === initial.prompts[0].preId))

        expect(playerTookQuest).to.be.false
        playerXP = 5000  // player goes and gets better...

        const secondTalk = interactWith('johnny')
        expect(secondTalk).to.eql(initial)
        const tryAccept2 = interactWith('johnny', secondTalk.prompts[0].id)

        expect(stripPrompts(tryAccept2)).to.eql(dialogues.find(d => d.id === secondTalk.prompts[0].next))
        expect(playerTookQuest).to.be.true

        clearDialogue('johnny')
      })
    })
  })
})
