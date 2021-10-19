/**
 * Simple Dialogue contains in-memory management of branching dialogue web games
 */
import { fastFind, typeIs } from './utils'

/**
 * @typedef {Object} Dialogue
 * @property {number} id unique id of the dialogue
 * @property {string} message display text of the npc dialogue
 * @property {number[]} [choices] array of dialogues ids representing the choices
 * the player will be given.
 * @property {number} [next] optional id of the next dialogue (required if no choices)
 * @property {function} [pre] optional prerequisite function that must return true
 * @property {number} [preId] optional dialogue id to redirect to if pre fails
 * (required if using pre)
 * @property {function} [post] optional function to run after the npc speaks the dialogue
 */

/**
 * @typedef {Dialogue} DialogueWithPrompts
 * @property {Dialogue[]} prompts a hydrated array of Dialogues from the choices array
 */

const dialogues = {}
const states = {}

function setState(npc, key, id) {
  states[npc][key] = id
}

function clearState(npc) {
  states[npc] = null
}

const hydratePrompts = (npc, choices) => (choices.length
  ? dialogues[npc].filter((d) => choices.includes(d.id))
  : []
)
const passPrereq = (dialogue) => (dialogue.pre ? dialogue.pre() : true)
const doPostReq = (dialogue) => (dialogue.post ? dialogue.post() : true)
const getDialogue = (npc, id) => (fastFind(dialogues[npc], (d) => d.id === id))

function validateDialogue({
  id, message, choices, pre, preId, post, next,
}) {
  const checks = []
  checks.push(typeIs(id, 'number') && typeIs(message, 'string'))
  if (choices) {
    checks.push(typeIs(choices, 'array'))
    if (choices.length) {
      choices.forEach((c) => checks.push(typeIs(c, 'number')))
    }
  } else {
    checks.push(typeIs(next, 'number') || typeIs(next, 'null'))
  }
  if (pre) {
    checks.push(typeIs(pre, 'function') && typeIs(preId, 'number'))
  }
  if (post) {
    checks.push(typeIs(post, 'function'))
  }

  if (checks.every((i) => i === true)) {
    return true
  }
  const customError = `simple-dialogue: malformed Dialogue object for dialogueId: ${id}.
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
  throw new Error(customError)
}

function speakCurrentDialogue(npc) {
  const currentDialogue = getDialogue(npc, states[npc].currentId)
  const prompts = currentDialogue.choices ? hydratePrompts(npc, currentDialogue.choices) : []
  return {
    ...currentDialogue,
    prompts,
  }
}

function playerUnqualified(npc, dialogue) {
  setState(npc, 'currentId', dialogue.preId)
  return speakCurrentDialogue(npc)
}

function goToNextDialogue(npc, processingDialogue) {
  const nextDialogue = getDialogue(npc, processingDialogue.next)
  setState(npc, 'currentId', nextDialogue.id)
}

function noCharacterExists(npc) {
  throw new Error(`simple-dialog: No dialogue found for ${npc}. Did you use loadDialogue() to create some?`)
}

/**
 * Interact with an npc will get the current line of dialogue or if choice id
 * argument is included then will move the npc conversation to the next dialogue
 * @method interactWith
 * @param {string} npc The key to a specific npc
 * @param {number} choiceId The dialogue id that the user speaks to the npc
 * @returns {DialogueWithPrompts}
 * @example
 * // assumes es6 modules import style
 * import { interactWith } from 'simple-dialogue'
 *
 * // load up dialogue (see other method)
 *
 * const johnnyResponse = interactWith('johnny')
 * const askJohnnyAboutFive = interactWith('johnny', 5)
 *
 */
export const interactWith = (npc, choiceId) => {
  if (!dialogues[npc]) {
    return noCharacterExists(npc)
  }
  const processingDialogue = choiceId
    ? getDialogue(npc, choiceId)
    : getDialogue(npc, states[npc].currentId)
  validateDialogue(processingDialogue)

  if (!passPrereq(processingDialogue)) {
    return playerUnqualified(npc, processingDialogue)
  }

  if (processingDialogue.next) {
    goToNextDialogue(npc, processingDialogue)
  }
  doPostReq(processingDialogue)
  return speakCurrentDialogue(npc)
}

/**
 * Load Dialogues for a specific npc/player conversation
 * @method loadDialogue
 * @param {string} npc The key to a specific npc
 * @param {Dialogue[]} dialogueDataItems An array of the Dialogues
 * that the npc and player will speak
 * @example
 * // assumes es6 modules import style
 * import { loadDialogue } from 'simple-dialogue'
 *
 * let johnnyRelationship = 60
 * let playerXP = 2000
 * let playerTookQuest = false
 *
 * const takeQuest = () => playerTookQuest = true
 * const dislikePlayer = () => johnnyRelationship -= 10
 * const isHighEnoughLevel = () => playerXP > 4000
 *
 * const johnnyDialogues = [
 *    {id: 1, message: `Would you like to take my quest?`, choices: [2, 3]},
 *    {id: 2, message: `Sure, I'll take it.`, pre: isHighEnoughLevel, preId: 5, post: takeQuest, next: 4},
 *    {id: 3, message: `Nah, not worth my time.`, post: dislikePlayer, next: 6},
 *    {id: 4, message: `Great! Go get me 300 chickens.`, next: null},
 *    {id: 5, message: `Hold up, come back after you've farmed a bit more.`, next: 1}
 *    {id: 6, message: `Thanks for nothing, buddy.`, next: null}
 * ]
 *
 * loadDialogue('johnny', johnnyDialogues)
 *
 */
export const loadDialogue = (npc, dialogueDataItems) => {
  dialogueDataItems.forEach((d) => validateDialogue(d))
  dialogues[npc] = dialogueDataItems
  states[npc] = { currentId: dialogueDataItems[0].id }
}

/**
 * Clear/delete Dialogues for a specific npc
 * @method clearDialogue
 * @param {string} npc The key to a specific npc
 * @example
 * // assumes es6 modules import style
 * import { clearDialogue } from 'simple-dialogue'
 *
 * clearDialogue('johnny')
 *
 */
export const clearDialogue = (npc) => {
  if (dialogues[npc]) {
    dialogues[npc] = null
  }
  if (states[npc]) {
    setState(npc, 'currentId', null)
    clearState(npc)
  }
}
