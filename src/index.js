/**
 * Simple Dialogue contains in-memory management of branching dialogue web games
 */
import fastFind from './fastFind'

/**
 * @typedef {Object} Dialogue
 * @property {number} id unique id of the dialogue
 * @property {string} message display text of the npc dialogue
 * @property {number[]} [choices] array of dialogueIds that will be presented as
 * choice prompts with this dialogue
 * @property {function} [pre] optional prerequisite function that must return true
 * @property {number} [preId] optional dialogue Id to use instead if using
 * prerequisite function and prerequisite is false
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

const hydratePrompts = (npc, choices) => (dialogues[npc].filter((d) => choices.includes(d.id)))
const passPrereq = (dialogue) => (dialogue.pre ? dialogue.pre() : true)
const doPostReq = (dialogue) => (dialogue.post ? dialogue.post() : true)
const hasNextLine = (dialogue) => (dialogue.next)
const getDialogue = (npc, id) => (fastFind(dialogues[npc], (d) => d.id === id))

function speakCurrentDialogue(npc) {
  const currentDialogue = getDialogue(npc, states[npc].currentId)
  return {
    ...currentDialogue,
    prompts: currentDialogue.choices.length ? hydratePrompts(npc, currentDialogue.choices) : [],
  }
}

function endConversation(npc) {
  setState(npc, 'currentId', null)
  return speakCurrentDialogue(npc)
}

function playerUnqualified(npc, dialogue) {
  if (!dialogue.preId) {
    throw new Error('No conversation option when player doesn\'t qualify for prerequisite!')
  }
  setState(npc, 'currentId', dialogue.preId)
  return speakCurrentDialogue(npc)
}

function goToNextDialogue(npc, processingDialogue) {
  const nextDialogue = getDialogue(npc, processingDialogue.next)
  setState(npc, 'currentId', nextDialogue.id)
}

/**
 * Interact with an npc will get the current line of dialogye or if choiceId
 * argument is included will move the npc conversation to the next dialogue
 * @method interactWith
 * @param {string} npc The key to a specific npc
 * @param {number} choiceId The dialogue id that the user speaks to the npc
 * @returns {DialogueWithPrompts}
 * @example
 * // assumes es6 modules import style
 * import { interactWith } from 'simple-dialogue'
 *
 * const johnnyResponse = interactWith('JohnnyBravo')
 *
 * // or to send specific dialogue choice to Johnny
 *
 * const johnnyResponse = interactWith('JohnnyBravo', 5)
 *
 */
export const interactWith = (npc, choiceId) => {
  if (choiceId) {
    const processingDialogue = getDialogue(npc, choiceId)

    if (!passPrereq(processingDialogue)) {
      return playerUnqualified(npc, processingDialogue)
    }

    if (!hasNextLine(processingDialogue)) {
      return endConversation(npc)
    }

    goToNextDialogue(npc, processingDialogue)
    doPostReq(processingDialogue)
  }
  return speakCurrentDialogue(npc)
}

/**
 * Load Dialogues for a specific npc
 * @method loadDialogue
 * @param {string} npc The key to a specific npc
 * @param {Dialogue[]} dialogueDataItems An array of the Dialogues
 * that the npc will speak to the user
 * @example
 * // assumes es6 modules import style
 * import { loadDialogue } from 'simple-dialogue'
 *
 * let johnnyRelationship = 60
 * let playerTookQuest = false
 * const takeQuest = () => playerTookQuest = true
 * const dislikePlayer = () => johnnyRelationship -= 10
 *
 * const johnnyDialogues = [{
 *    id: 1,
 *    message: 'Would you like to take my quest?',
 *    choices: [2, 3]
 *  }, {
 *    id: 2,
 *    message: 'Sure, I\'ll take it.',
 *    post: takeQuest,
 *    next: 4
 *  }, {
 *    id: 3,
 *    message: 'Nah, not worth my time.',
 *    post: dislikePlayer,
 *    next: 5
 *  }]
 *
 * loadDialogue('JohnnyBravo', johnnyDialogues)
 *
 */
export const loadDialogue = (npc, dialogueDataItems) => {
  dialogues[npc] = dialogueDataItems
  states[npc] = { currentId: dialogueDataItems[0].id }
}

/**
 * Clear/delete Dialogues for a specific npc
 * @method clearDialogue
 * @param {string} npc The key to a specific npc
 * @example
 * // assumes es6 modules import style
 * import { loadDialogue } from 'simple-dialogue'
 *
 * const johnnyDialogues = [{
 *    id: 1,
 *    message: 'Hello?',
 *    choices: [2]
 *  }, {
 *    id: 2,
 *    message: 'Nevermind.'
 *  }]
 *
 * loadDialogue('JohnnyBravo', johnnyDialogues)
 * // some time later....
 * clearDialogue('JohnnyBravo')
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
