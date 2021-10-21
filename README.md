# simple-dialogue
![Build](https://github.com/bpkennedy/simple-dialogue/actions/workflows/test.yml/badge.svg)
[![Coverage](https://api.codeclimate.com/v1/badges/49fc150e78f4127c02a1/test_coverage)](https://codeclimate.com/github/bpkennedy/simple-dialogue/test_coverage)
[![DeepScan grade](https://deepscan.io/api/teams/15720/projects/18948/branches/477054/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=15720&pid=18948&bid=477054)
![](https://img.shields.io/badge/gzip%20size-1349%20Bytes-brightgreen.svg)

A dead simple, zero-dependency, branching dialogue system written in javascript for RPG and visual novel games

## Purpose
After trying out a few different libraries that do similar branching dialogue
for npc conversations and reading some material([1]) about various approaches
to this (hub and spoke, waterfall models), I wanted to write something that allowed
flexibility. Specifically I wanted a couple lifecycle hooks
(this is where `pre` and `post` come in), and I also wanted dialogue system itself
to not concern itself with managing as little state internally as it could to provide
the basics.

[1]: [https://www.gamedeveloper.com/design/branching-conversation-systems-and-the-working-writer-part-1-introduction](https://www.gamedeveloper.com/design/branching-conversation-systems-and-the-working-writer-part-1-introduction)

## Install
From your project directory on the commandline/terminal:
```bash
npm install --save simple-dialogue
```

## Setup
### As es6 module:
```javascript
import { loadDialogue, interactWith, clearDialogue } from 'simple-dialogue'
```

### As node/es5:
```javascript
const { loadDialogue, interactWith, clearDialogue } = require('simple-dialogue')
```

### As browser script:
```html
<script src="https://cdn.jsdelivr.net/gh/bpkennedy/simple-dialogue@1.0.0/dist/compiled.browser.js"></script>
```

## Usage
A *Dialogue* means a single "unit" of dialogue, spoken by either an npc or the player, in a larger
conversation (many Dialogues). If you could break a conversation down into "turns speaking", then each turn would be 
a Dialogue.

A Dialogue has an interface like this:
```javascript
{
    id: 1, // required, unique number
    message: '', // required, string
    choices: [1,2,3],
    next: 1,
    pre: () => {},
    preId: 1,
    post: () => {}
}
```

|               |             |                   |                                                                               |
| ------------- | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `id`          | number      | required          |           a unique id                                                         |
| `message`     | string      | required          |any string, template literals are supported                                     |
| `choices`     | number[]    | optional          |    array of other dialogue `id`'s                                                |
| `next`        | number      | required/optional | the next dialogue `id` to go to. optional, but **required if `choices` is empty or omitted**   |
| `pre`         | function    | optional          | your callback function. Must return truthy or falsy. Will not go to `next` if `pre` fails  |
| `preId`       | number      | required/optional | if `pre` fails, this is the dialogue `id` to redirect to. optional, but **required if `pre` is used**     |
| `post`        | function    | optional          | your callback function. No return needed, does not effect whether going to `next` or not   |                                                                              |


## Lifecycle hooks
### `pre` (prerequisite):
will be run when it's dialogue is being processed by the npc. By returning a falsy or truthy value,
you can control the conversation branching to one dialogue or another (or not moving forward at all).
```javascript
const isHighEnoughLevel = () => somePlayer.someProperty === 'somePrerequisiteValue'

{id: 1, message: `Would you like to take my quest?`, choices: [2]},
{id: 2, message: `Sure, I'll take it.`, pre: isHighEnoughLevel, preId: 5, next: 4},
```
When the npc presents the message "Would you like to take my quest?", and your choice is
"Sure, I'll take it.", the `isHighEnoughLevel` callback that you
provided is evaluated - perhaps it's based on some attribute or item of your player - and if truthy, the `next`
dialogue is loaded for the npc next.  If it is falsy, then the `preId` dialogue is loaded. 

### `post` (postrequisite):
will be run after the npc has processed and loaded the next dialogue. The return of this function is not used by the
npc (or this library). It's purely for your code to use for setting your own state and game logic at specific points
during the conversation.
```javascript
const takeQuest = () => somePlayer.someStatus = 'acceptedChickenQuest'

{id: 1, message: `Will you catch my runaway chickens?!`, choices: [2]},
{id: 2, message: `Sure, I'll get'em.`, post: takeQuest, next: 3},
```
## Ending and Restarting conversation
To indicate that a conversation is complete, set a dialogue's `next` to be null or undefined. This can be done on
either a player choice kind of dialogue or a npc response kind of dialogue. When the npc processes a dialogue with 
`next` set as null/undefined, it will default to using the last dialogue that it had responded with.

In this way, you may have flexibility in that an npc end conversation in waterfall style fashion (i.e. player only gets the last thing
that an npc said and cannot 'retry' the conversation):
```javascript
// ------a player choice ending a conversation--------
{id: 1, message: 'You doing alright?', choices: [2,3]},
{id: 2, message: 'Yea', next: null},
{id: 3, message: 'No', next: null},

interact('guy')
// provides: You doing alright?
// provides choice #2:  Yea
// provides choice #3:  No

interact('guy', 2)
interact('guy') // provides: You doing alright?

// -------an npc ending the conversation---------
{id: 1, message: `Will you catch my runaway chickens?!`, choices: [2]},
{id: 2, message: `No, I hate chickens, and I hate you.`, next: 3},
{id: 3, message: `You are such a disappointment`, next: null}

interact('guy')
// provides: Will you catch my runaway chickens?
// provides choice #2:  No, I hate chickens, and I hate you.

interact('guy', 2) // provides: You are such a disappointment.

interact('guy') // provides repeat: You are such a disappointment.
```

or you can retry an npc conversation in the hub-and-spoke style (i.e. player can retry conversation to explore
other choices) by setting a previous dialogue id rather than null to loop your conversation:
```javascript
{id: 1, message: `Will you catch my runaway chickens?!`, choices: [2,3]},
{id: 2, message: `No, I hate chickens, and I hate you.`, next: 4},
{id: 3, message: `Yes.`, next: 5},
{id: 4, message: `Huh, come back when you're ready to help`, next: 1}, // routes back to beginning
{id: 5, message: `Thanks for taking my quest! Come see me when you have it finished!`, next: null},

interact('guy')
// provides: Will you catch my runaway chickens?!
// provides choice #2:  No, I hate chickens, and I hate you.
// provides choice #3:  Yes.

interact('guy', 2) // provides: Huh, come back when you're ready to help

interact('guy') // provides reset: Will you catch my runaway chickens?!
```

### Development
Want to contribute? Great! To fix a bug or enhance a feature, follow these steps:

- Fork the repo
- Create a new branch (`git checkout -b improve-feature`)
- Make the appropriate changes in the files
- Ensure that linting and tests pass, and that coverage is at 100%.
  - `npm run prepull`
- Add changes to reflect the changes made
- Commit your changes (`git commit -am 'Improve feature'`)
- Push to the branch (`git push origin improve-feature`)
- Create a Pull Request

### Bug / Feature Request
If you find a bug, kindly open an issue [here](https://github.com/bpkennedy/simple-dialogue/issues/new).

If you'd like to request new functionality or feature, feel free to do so by opening an issue [here](https://github.com/bpkennedy/simple-dialogue/issues/new). Please describe the functionality or feature you'd like to see.

## To-do
- Add non-literal dialogue choices:
```javascript
{id: 1, message: `Will you catch my runaway chickens?!`, choices: [2]},
{id: 2, mask: '[Angry Negative]', message: `No, I hate chickens, and I hate you.`, next: 4},
// the 'mask' property could be what is displayed to the player, but the message is the literal line
// as they'll see it - providing interest and color in their player "coming alive".
```

## [License](https://github.com/bpkennedy/simple-dialogue/blob/main/LICENSE.md)

MIT © [Brian Kennedy](https://github.com/bpkennedy)
