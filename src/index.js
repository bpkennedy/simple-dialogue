import { fastFilter, fastFind } from './util'

const dialogues = {}
const states = {}

function getDialogueWithPrompts(npc, dialogue) {
  const clonedDialogue = { ...dialogue }
  if (clonedDialogue.choices.length) {
    clonedDialogue.prompts = fastFilter(dialogues[npc],
      (d) => clonedDialogue.choices.includes(d.id))
  }
  return clonedDialogue
}

const passPrereq = (dialogue) => (dialogue.pre ? dialogue.pre() : true)
const getDialogue = (npc, id) => (fastFind(dialogues[npc], 'id', id))

function speakCurrentDialogue(npc) {
  const currentDialogue = getDialogue(npc, states[npc].currentId)
  return {
    dialogue: passPrereq(currentDialogue)
      ? getDialogueWithPrompts(npc, currentDialogue) : getDialogue(npc, currentDialogue.preId),
  }
}

function considerDialogue(npc, dialogue) {
  if (dialogue.post) {
    dialogue.post()
  }
  const nextDialogue = getDialogue(npc, dialogue.next)
  if (!passPrereq(nextDialogue)) {
    states[npc].currentId = nextDialogue.preId
    return
  }
  states[npc].currentId = nextDialogue.id
}

export const interactWith = (npc, choiceId) => {
  if (choiceId) {
    considerDialogue(npc, getDialogue(npc, choiceId))
  }
  return speakCurrentDialogue(npc)
}

export const loadDialogue = (npc, dialogueDataItems) => {
  dialogues[npc] = dialogueDataItems
  states[npc] = { currentId: dialogueDataItems[0].id }
}

export const clearDialogue = (npc) => {
  if (dialogues[npc]) {
    dialogues[npc] = null
  }
  if (states[npc]) {
    states[npc].currentId = null
    states[npc] = null
  }
}
