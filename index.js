/*
Twitch Multigoal

Copyright © <2022> <Victor Liljeholm>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
let http = require("http")
let eventsub = require("./tools/TwitchPubSub")
let Auth = require("./tools/Auth")
let TAPI = require("./tools/TwitchAPI")
let fs = require("fs")
let sound = require("sound-play")
const { confirm, input, select } = require("@inquirer/prompts")
const readline = require("readline")

let commandRl = null
let commandLoopOpen = false

async function askInt(message) {
  const value = await input({
    message,
    validate: (v) => !isNaN(parseInt(v, 10)) || "Please enter a number",
  })
  return parseInt(value, 10)
}

async function askFloat(message) {
  const value = await input({
    message,
    validate: (v) => !isNaN(parseFloat(v)) || "Please enter a number",
  })
  return parseFloat(value)
}

async function askSelect(message, choices) {
  const hint = "(select)"
  const fullMessage = message.includes(hint) ? message : `${message} ${hint}`
  return select({ message: fullMessage, choices })
}

const tmi = require('tmi.js');
const defaultSettings = {
  "installed": false,
  "channel": "",
  "username": "",
  "token": "TOKEN",
  "chatMessage": "",
  "soundPath": "",
  "soundVolume": "",
  "outputString": "",
  "points": 0,
  "defaultGoal": 10,
  "goal": 10,
  "defaultGoalCount": 1,
  "goalCount": 1,
  "currentBitsAmount": 0,
  "currentSubsPointsAmount": 0,
  "pointsPerPrimeSubscription": 1,
  "pointsPerTier1Subscription": 1,
  "pointsPerTier2Subscription": 2,
  "pointsPerTier3Subscription": 3,
  "pointsPerGiftedTier1Subscription": 1,
  "pointsPerGiftedTier2Subscription": 2,
  "pointsPerGiftedTier3Subscription": 3,
  "shouldGiftedFromChannelCount": false,
  "shouldchannelPointsRedeemsTrigger": false,
  "channelPointsRedeemsTriggerList": {},
  "cheerMode": "off",
  "pointsToAddPerCheer": 1,
  "bitsToIncreasePoints": 500,
  "shouldWritetoBitsFile": false,
  "bitsTextFormat": "${bits}/${bitsToPoints} bits to reach goal number #${goalCount}",
  "controlCommandName": "!goaledit",
  "difficultyMode": false,
  "difficultyPointIncrease": 1,
  "upgradedSubsAllowed": false,
  "pointsPerUpgradedSub": 1, 
  "version": 8,
  "eventsub": {
    "eventsub_token": "TOKEN",
    "eventsub_refresh_token": "TOKEN",
    "eventsub_expires_in": "TOKEN"
  }
};



const load = () =>{
  if(fs.existsSync("settings.json")){
    let rawData = fs.readFileSync("settings.json")
    data = JSON.parse(rawData)
  }else{
    let fileID = fs.openSync("settings.json", "w")
    fs.closeSync(fileID)
    data = defaultSettings
    save()
  }
} 

const save = () => {
  let rawData = JSON.stringify(data, null, 4)
  fs.writeFileSync("settings.json", rawData)
}

function saveAndExit(){
  let rawData = JSON.stringify(data)
  fs.writeFile("settings.json", rawData, null, () => {
    exit()
  })
}
const update = async () =>{
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    New version found
    -------------------------------------------------------------------------------------
    A new version have been found and so new settings will apply and new settings might be
    asked for.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
  if(!data.version || data.version === 1){
    console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Hype Chat Settings
    -------------------------------------------------------------------------------------
    Time to set up points for hype chats, here you can choose if hype chats should count
    towards the multigoal and how much many points each level should give. There is two 
    modes for Hype chat, these are: \n
    automatic: You set the base Hype chat level where one point should be added towards
    the goal, then the scripts figure out how much other levels should give. Example if
    you set it to 3, it will require three level 1 or two level 2 to get one point, or 
    a level 4 will give 2 points, it's all accumulative. \n
    manual: You set how many points each hype level is worth, these can be decimal numbers.
    these are also accumulative, so if you have one that is less then 0, let's say 0.5,
    it will require two of those to get one point.\n
    decimal numbers are allowed for manual mode up tp 2 decimal places, the decimal needs
    to be written with a dot. So for example 1.5 and not 1,5.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    data.hypeChatsActive = await askSelect("What mode do you want for Hype chats?", [
      { name: "off", value: "off" },
      { name: "manual", value: "manual" },
      { name: "automatic", value: "automatic" },
    ])
    if(data.hypeChatsActive === "manual"){
      data.pointsForLevelONE = await askFloat("How many points should a level 1 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelTWO = await askFloat("How many points should a level 2 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelTHREE = await askFloat("How many points should a level 3 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelFOUR = await askFloat("How many points should a level 4 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelFIVE = await askFloat("How many points should a level 5 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelSIX = await askFloat("How many points should a level 6 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelSEVEN = await askFloat("How many points should a level 7 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelEIGHT = await askFloat("How many points should a level 8 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelNINE = await askFloat("How many points should a level 9 hype chat be worth? (number only, decimal allowed)")
      data.pointsForLevelTEN = await askFloat("How many points should a level 10 hype chat be worth? (number only, decimal allowed)")
    }else if(data.hypeChatsActive === "automatic"){
      data.automaticBaseLevel = await askInt("What hype chat level should be the base for getting points? (numbers only)")
      convertLevelToString()
    }else{
      data.hypeChatsActive = "off"
    }
    data.version = 2
  }
  if(!data.version || data.version === 2){
    if("hypeChatsActive" in data){
      delete data.hypeChatsActive
    }
    if("pointsForLevelONE" in data){
      delete data.pointsForLevelONE
    }
    if("pointsForLevelTWO" in data){
      delete data.pointsForLevelTWO
    }
    if("pointsForLevelTHREE" in data){
      delete data.pointsForLevelTHREE
    }
    if("pointsForLevelFOUR" in data){
      delete data.pointsForLevelFOUR
    }
    if("pointsForLevelFIVE" in data){
      delete data.pointsForLevelFIVE
    }
    if("pointsForLevelSIX" in data){
      delete data.pointsForLevelSIX
    }
    if("pointsForLevelSEVEN" in data){
      delete data.pointsForLevelSEVEN
    }
    if("pointsForLevelEIGHT" in data){
      delete data.pointsForLevelEIGHT
    }
    if("pointsForLevelNINE" in data){
      delete data.pointsForLevelNINE
    }
    if("pointsForLevelTEN" in data){
      delete data.pointsForLevelTEN
    }
    if("automaticBaseLevel" in data){
      delete data.automaticBaseLevel
    }
    if("pointsToAddPerHypeChat" in data){
      delete data.pointsToAddPerHypeChat
    }
    console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Hype Chat Settings removed
    -------------------------------------------------------------------------------------
    The hype chat settings have been removed as the old hype chat is no longer a thing on
    twitch and is now replaced with bits.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    data.version = 3
  }

  if(!data.version || data.version === 3){
    data.difficultyMode = false
    data.difficultyPointIncrease = 1
    console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    New settings (Goal Increase Mode)
    -------------------------------------------------------------------------------------
    Settings for the new difficulty mode have been added, this mode will increase the goal
    each time it has been reached, the amount it will increase by can be set when setting 
    up the script. By default it is off, if you want to use this feature you need to reset
    the script, this can be done by using the following command in CMD: fullReset()
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    data.version = 4
  }


  if(!data.version || data.version === 4){
    data.upgradedSubsAllowed = false
    data.pointsPerUpgradedSub = 1
    console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    "Upgraded subscription settings"
    -------------------------------------------------------------------------------------
    The Multigoal can now add points if someone "upgrades" their prime or gifted subscription
    to a regular subscription. So you can now award people who uppgrade their subscription. 
    Be aware that this can create a "double" dip that month as when their subscription 
    renews the same month they upgraded, they will get points for that too.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    
    const updateUpgradedQuestion = await confirm({
      message: "Enable points for 'upgraded' prime/gifted subscriptions?",
      default: false,
    })

    if(updateUpgradedQuestion){
      data.upgradedSubsAllowed = true
      data.pointsPerUpgradedSub = await askInt("How many points should be added when someone 'upgrades' their subscription? (number only)") 
    }else{
      data.upgradedSubsAllowed = false
      data.pointsPerUpgradedSub = 1
    }
    data.version = 5
  }

  

  if(data.version === 5){
    data.eventsub = {
      "eventsub_token": "TOKEN",
      "eventsub_refresh_token": "TOKEN",
      "eventsub_expires_in": "TOKEN"
    }
  }

  if(!data.version || data.version === 6 && data.cheerMode === "accumulated"){
    console.log(`
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    "Bits text file"
    -------------------------------------------------------------------------------------
    You can write extra bit data in a seperate file for example how many more bits are
    needed to get a point, this gets written to BitOutput.txt. This is mostly useful if 
    you have the cheer mode set to "accumulated". You have the following parameters for 
    the text formatting: \n
    \${bitsToPoint} : the total amount of bits towards reaching the next point.\n
    \${bitsForPoint} : the total amount of bits needed to reach the next point.\n
    \${bitsToGoal} : the total amount of bits towards reaching the goal. \n
    \${bitsForGoal} : the total amount of bits needed to reach the goal. \n
    \${points} : current points.\n
    \${goal} : the goal set.\n
    \${goalCount} : the number of times the goal has been reached.\n
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    data.shouldWritetoBitsFile = await confirm({
      message: "Do you want to write extra bit data (gets written to BitOutput.txt)?",
      default: false,
    })
    if(data.shouldWritetoBitsFile){
      data.bitsTextFormat = await input({ message: "How should the text be formatted?" })
    }else{
      data.bitsTextFormat = ""
    }
    data.version = 7  
  }else if(!data.version || data.version === 6){
    data.bitsTextFormat = ""
    data.version = 7
  }


  if(!data.version || data.version === 7){
    if(data.shouldWritetoBitsFile === "n"){
      data.shouldWritetoBitsFile = false
    }else if(data.shouldWritetoBitsFile === "y"){
      data.shouldWritetoBitsFile = true
    }
    
    data.eventsub = {
      "eventsub_token": "TOKEN",
      "eventsub_refresh_token": "TOKEN",
      "eventsub_expires_in": "TOKEN"
    }
    await SetUpChannelPoints()
    data.version = 8
  }
  
  data.version = 8
  save()
  
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Version update done
    -------------------------------------------------------------------------------------
    Your new settings is now saved and the script will continue like usual.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
}

async function SetUpChannelPoints(){
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    "Channel Points Redeems"
    -------------------------------------------------------------------------------------
    You can set up channel points redeems to add or remove points from the multigoal. If
    you want this select yes (y), then you get to select what channel point redeem should 
    trigger the multigoal and how many points should be added or removed.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    const channelPointsRedeemsQuestion = await confirm({
      message: "Do you want to set up channel points redeems?",
      default: false,
    })
    if(channelPointsRedeemsQuestion){
      data.shouldchannelPointsRedeemsTrigger = true
      data.channelPointsRedeemsTriggerList = {}
      await setupChannelPointsRedeemsTriggerList()
    }else{
      data.shouldchannelPointsRedeemsTrigger = false
      data.channelPointsRedeemsTriggerList = {}
    }
}

async function setupChannelPointsRedeemsTriggerList(){
  let channelPointsRedeems = await TwitchAPI.getChannelPointsRedeems()
  if(!channelPointsRedeems.wasSuccessful){
    console.log("Error getting channel points redeems: ", channelPointsRedeems.statusText)
    return
  }

  let newChannelPointTriggers = await gatherChannelPointTriggers(channelPointsRedeems.channelPointsRedeems)
  data.channelPointsRedeemsTriggerList = {
    ...data.channelPointsRedeemsTriggerList,
    ...newChannelPointTriggers
  }
}

async function gatherChannelPointTriggers(channelPointsRedeems){
  let newChannelPointTriggers = {}
  let channelPointEntries = Object.entries(channelPointsRedeems)

  if(channelPointEntries.length === 0){
    console.log("No channel point redeems found.")
    return newChannelPointTriggers
  }

  let selectedRedeemId = await askSelect("Which channel point redeem do you want to set up?", channelPointEntries.map(([id, title]) => ({
    name: title,
    value: id,
  })))

  let addOrRemove = await askSelect("Should this channel point redeem add or remove points?", [
    { name: "add", value: "add" },
    { name: "remove", value: "remove" },
  ])

  newChannelPointTriggers[selectedRedeemId] = {
    id: selectedRedeemId,
    title: channelPointsRedeems[selectedRedeemId],
    action: addOrRemove,
    points: 0
  }

  let numberOfPoints = await askInt("How many points should be added or removed? (number only)")

  newChannelPointTriggers[selectedRedeemId].points = numberOfPoints

  let addAnotherChannelPointRedeem = await confirm({
    message: "Do you want to add another channel point redeem?",
    default: false,
  })
  if(addAnotherChannelPointRedeem){
    return {...newChannelPointTriggers, ...await gatherChannelPointTriggers(channelPointsRedeems)}
  }
  return newChannelPointTriggers
}

const setup = async() =>{
  console.log(`
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Welcome to the setup of Twitch Multi goal and general settings
    -------------------------------------------------------------------------------------
    Time to set up some general settings for the multigoal. When setting up what should be
    written to the output.txt file you can use the following parameters:\n
    \${points} : current points.\n
    \${goal} : the goal set.\n
    \${goalCount} : numbers of time the goal has been reached. \n
    an example would be "\${points}/\${goal} points to reach goal number #\${goalCount}"\n
    This will also ask if you want to enable difficulty mode, this will increase the goal
    each time it's reached by the given amount.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.channel = (await input({ message: "What is your channel name?" })).trim().toLowerCase()
  data.defaultGoal = await askInt("How many points should be required to reach the goal? (number only)")
  data.goal = data.defaultGoal
  data.defaultGoalCount = await askInt("What count should the multigoal start at? (numbers only)")
  data.goalCount = data.defaultGoalCount
  data.outputString = await input({ message: "How should the text in output.txt be formatted?" })
  const difficultyModeAnswer = await confirm({
    message: "Enable difficulty mode (increases the goal each time it is reached)?",
    default: false,
  })
  if(difficultyModeAnswer){
    data.difficultyMode = true
    data.difficultyPointIncrease = await askInt("How much should the goal increase by each time it's reached? (number only)")
  }else{
    data.difficultyMode = false
  }

  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Subscription Settings
    -------------------------------------------------------------------------------------
    Time to set up points for subscription, normal sub or resub will give points when
    a user "announces" it in stream, gifted points will be given out right as someone
    gifts sub, if it's a multi month gifted sub the set points will be multiplied with
    the number of months gifted.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.pointsPerPrimeSubscription = await askInt("How many points should a prime (re)sub be worth? (numbers only)")
  data.pointsPerTier1Subscription = await askInt("How many points should a tier 1 (re)sub be worth? (numbers only)")
  data.pointsPerTier2Subscription = await askInt("How many points should a tier 2 (re)sub be worth? (numbers only)")
  data.pointsPerTier3Subscription = await askInt("How many points should a tier 3 (re)sub be worth? (numbers only)")
  console.log("\n")
  data.pointsPerGiftedTier1Subscription = await askInt("How many points should one tier 1 gift sub be worth? (numbers only)")
  data.pointsPerGiftedTier2Subscription = await askInt("How many points should one tier 2 gift sub be worth? (numbers only)")
  data.pointsPerGiftedTier3Subscription = await askInt("How many points should one tier 3 gift sub be worth? (numbers only)")
  
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    "Upgraded subscription settings"
    -------------------------------------------------------------------------------------
    Do you want to reward people who upgrade their prime or gifted subscription to a regular
    subscription? Be aware that this can create a "double" dip that month as when their 
    subscription renews the same month they upgraded, they will get points for that too.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    
  const updateUpgradedQuestion = await confirm({
    message: "Enable points for 'upgraded' prime/gifted subscriptions?",
    default: false,
  })
  if(updateUpgradedQuestion){
    data.upgradedSubsAllowed = true
    data.pointsPerUpgradedSub = await askInt("How many points should be added when someone 'upgrades' their subscription? (number only)") 
  }else{
    data.upgradedSubsAllowed = false
    data.pointsPerUpgradedSub = 1
  }

  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Cheer Settings
    -------------------------------------------------------------------------------------
    Time to set up points for cheers, here you can choose if cheers should count towards
    the multigoal and how much needs to be cheered to increase points.
    The cheer mode can be set to the following:\n
    off = cheers do no not count towards multigoal.\n
    accumulated = increases the counter whenever reaching "bitsToIncreasePoints" amounts
    of bits total given, so several small bit amount from different people can count
    towards points to the multigoal. also any overflow will be saved towards the next point.\n
    single = only single amount that goes over "bitsToIncreasePoints" will add points 
    towards the bits. There is also no overlow.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.cheerMode = await askSelect("What mode do you want for cheers?", [
    { name: "off", value: "off" },
    { name: "accumulated", value: "accumulated" },
    { name: "single", value: "single" },
  ])
  if(data.cheerMode !== "off"){
    data.bitsToIncreasePoints = await askInt("How much needs to be cheered to increase the points? (number only)")
    data.pointsToAddPerCheer = await askInt("How many points should be added when reached? (numbers only)")
  }


  console.log(`\n
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  Bits text file
  -------------------------------------------------------------------------------------
  You can write extra bit data in a seperate file for example how many more bits are 
  needed to get a point, this gets written to BitOutput.txt. This is mostly useful if 
  you have the cheer mode set to "accumulated". You have the following parameters for 
  the text formatting: \n
  \${bitsToPoint} : the total amount of bits towards reaching the next point.\n
  \${bitsForPoint} : the total amount of bits needed to reach the next point.\n
  \${bitsToGoal} : the total amount of bits towards reaching the goal. \n
  \${bitsForGoal} : the total amount of bits needed to reach the goal. \n
  \${points} : current points.\n
  \${goal} : the goal set.\n
  \${goalCount} : the number of times the goal has been reached.\n
  -------------------------------------------------------------------------------------
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.shouldWritetoBitsFile = await confirm({
    message: "Do you want to write extra bit data (gets written to BitOutput.txt)?",
    default: false,
  })
  if(data.shouldWritetoBitsFile){
    data.bitsTextFormat = await input({ message: "How should the text be formatted?" })
  }else{
    data.bitsTextFormat = ""
  }
  
  await SetUpChannelPoints()
  
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Chat settings
    -------------------------------------------------------------------------------------
    Do you want a chat message to appear when a goal has been reached? When setting up
    the chat message format the following parameters can be used: \n
      \${points} = current points. \n
      \${goal} = the goal set. \n
      \${goalCount} = the number of times the goal has been reached. 
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)

  const wantsChatMessage = await confirm({
    message: "Show a chat message when a goal is reached?",
    default: false,
  })
  if(wantsChatMessage){
    data.chatMessage = await input({ message: "What should the chat message say?" })
  } else {
    data.username = ""
    data.token = "TOKEN"
    data.chatMessage = ""
  }


  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Sound settings
    -------------------------------------------------------------------------------------
    Do you want a sound to play when the goal has been reached? For that you need give 
    the full path to a sound file, only .wav and .mp3 files is guranteed to work.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)

  const wantsSound = await confirm({
    message: "Play a sound when a goal is reached?",
    default: false,
  })

  if(wantsSound){
    data.soundPath = await input({ message: "What is the full path to the sound file you want to play?" })
    data.soundVolume = await askInt("Volume level (can be between 0 and 100)") / 100
  }
  else{
    data.soundPath = ""
    data.soundVolume = 0
  }

  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Command settings
    -------------------------------------------------------------------------------------
    There is a number of commands you or your moderator can use to control the multigoal,
    these being the following:
    controlCommandName reset         : Resets the multigoal
    controlCommandName p+            : Increases the points by 1
    controlCommandName p+ NUMBER     : Increases the points by NUMBER
    controlCommandName p-            : Decreaese the points by 1
    controlCommandName p- NUMBER     : Decreaess the points by NUMBER
    controlCommandName g+            : Increases the number of goal reached by 1
    controlCommandName g+ NUMBER     : Increases the number of goal reached by NUMBER
    controlCommandName g-            : Decreaese the number of goal reached by 1
    controlCommandName g- NUMBER     : Decreaess the number of goal reached by NUMBER
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.controlCommandName = await input({ message: "What should the control command name be to control the multigoal?" })

  data.installed = true
  save()
}
function convertLevelToString(){
  switch(data.automaticBaseLevel){
    case 1: data.automaticBaseLevel = "ONE"; break;
    case 2: data.automaticBaseLevel = "TWO"; break;
    case 3: data.automaticBaseLevel = "THREE"; break;
    case 4: data.automaticBaseLevel = "FOUR"; break;
    case 5: data.automaticBaseLevel = "FIVE"; break;
    case 6: data.automaticBaseLevel = "SIX"; break;
    case 7: data.automaticBaseLevel = "SEVEN"; break;
    case 8: data.automaticBaseLevel = "EIGHT"; break;
    case 9: data.automaticBaseLevel = "NINE"; break;
    case 10: data.automaticBaseLevel = "TEN"; break; 
  }
}

function debugtxt(...text){
  if(data.debug){
    for(let i=0; i<text.length; i++){
      console.log(txt[i])
    }
  }
}

let chat
const execute = () => {
  let tokenstring 
  try{
    
    if(data.eventsub.eventsub_token && data.eventsub.eventsub_token !== "TOKEN"){
      tokenstring = "with token"
      chat = new tmi.Client(
        {
          identity: {
            username: data.channel,
            password: `oauth:${data.eventsub.eventsub_token}`
          },
          channels: [data.channel]
        }
      )
    }else{
      tokenstring = "without token"
      chat = new tmi.Client(
        {
          channels: [data.channel]
        }
      )
    }
  }catch(err){
    console.log("Error connecting to chat: ", err)
  }

  chat.connect().then(() => {
    console.log(`
      ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
      Connected to channel: ${data.channel} ${tokenstring}, ready to receive events! 
      If you want information on commands you can use, type commands() \n
      ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)

    chat.removeAllListeners()

    fileWriteHandler()
    updateBitstxtFile()

    chat.on("message", (channel, tags, message, self)=>{
      if(tags !== null && tags !== undefined){
        if(message.split(" ")[0].toLowerCase() === data.controlCommandName.toLowerCase()){
          if((tags.badges.moderator === "1" || tags.badges.broadcaster === "1")){
            controlCommand(message.split(" "))
          }
        }
      }else{
        debugtxt(tags, message)
      }
    })
    chat.on("anongiftpaidupgrade", (channel, username, userstate) =>{
      if(data.upgradedSubsAllowed){
        console.log(`${CurrentTime()}: Gifted upgrade, name: ${username}`)
        PointsChangeQueue("subs", "add", data.pointsPerUpgradedSub)
      }
    })

    chat.on("giftpaidupgrade", (channel, username, sender, userstate) =>{
      if(data.upgradedSubsAllowed){
        console.log(`${CurrentTime()}: Gifted upgrade, name: ${username}`)
        PointsChangeQueue("subs", "add", data.pointsPerUpgradedSub)
      }
    })

    let raw_messages = []
    chat.on("raw_message", (messageCloned, message) => {
      if(data.upgradedSubsAllowed && message.command === "USERNOTICE" && message.tags["msg-id"] === "primepaidupgrade"){
        console.log(`${CurrentTime()}: Prime upgrade, name: ${message.tags["login"]}`)
        PointsChangeQueue("subs", "add", data.pointsPerUpgradedSub)
      }
    })


    chat.on("subscription", (channel, username, method, message, userstate) => {
      switch(userstate["msg-param-sub-plan"]){
        case "Prime":{
        PointsChangeQueue("subs", "add", data.pointsPerPrimeSubscription)
        break
        }
        case("1000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier1Subscription)
          break
        }
        case("2000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier2Subscription)
          break
        }
        case("3000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier3Subscription)
          break
        }
        default:{
          console.log(`${CurrentTime()}: Something went wrong reading subscription`)
        }
      }
      console.log(`${CurrentTime()}: Subscription from: ${username}, tier: ${userstate["msg-param-sub-plan"]}`)
    })

    chat.on("resub", (channel, username, months, message, userstate, methods) => {
      switch(userstate["msg-param-sub-plan"]){
        case "Prime":{
        PointsChangeQueue("subs", "add", data.pointsPerPrimeSubscription)
        break
        }
        case("1000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier1Subscription)
          break
        }
        case("2000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier2Subscription)
          break
        }
        case("3000"):{
          PointsChangeQueue("subs", "add", data.pointsPerTier3Subscription)
          break
        }
        default:{
          console.log(`${CurrentTime()}: Something went wrong reading resubscription`)
        }
      }
      console.log(`${CurrentTime()}: Resubscription from: ${username}, tier: ${userstate["msg-param-sub-plan"]}`)
    })

    chat.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
      if (username.toLowerCase() ===  data.channel.toLowerCase() && !data.shouldGiftedFromChannelCount) return
      
      let giftMonths = parseInt(userstate["msg-param-gift-months"])
      
      if(isNaN(giftMonths)){
        giftMonths = 1
      }
      
      switch(userstate["msg-param-sub-plan"]){
        case("1000"):{
          PointsChangeQueue("subs", "add", data.pointsPerGiftedTier1Subscription*giftMonths)
          break
        }
        case("2000"):{
          PointsChangeQueue("subs", "add", data.pointsPerGiftedTier2Subscription*giftMonths)
          break
        }
        case("3000"):{
          PointsChangeQueue("subs", "add", data.pointsPerGiftedTier3Subscription*giftMonths)
          break
        }
        default:{
          console.log(`${CurrentTime()}: Something went wrong reading subscription gift`)
        }
      }

      console.log(`${CurrentTime()}: Gift Subscription from: ${username}, recipient: ${recipient}, tier: ${userstate["msg-param-sub-plan"]}, months: ${giftMonths}.`)
    })

  }).catch((err) => {
    console.log(`${CurrentTime()}: Chat connection error`)
    console.log(err)
  })
}


function bitsPointCalculation(bits){
  let timesReached = 0
  switch(data.cheerMode){
    default:
    case "off":{
      return
    }
    case "accumulated":{
      data.currentBitsAmount += bits
      timesReached = Math.floor(data.currentBitsAmount/data.bitsToIncreasePoints)
      if(timesReached >= 1){
        data.currentBitsAmount = data.currentBitsAmount%data.bitsToIncreasePoints
      }
      break;
    }
    case "single":{
      timesReached = Math.floor(bits/data.bitsToIncreasePoints)
      break;
    }
  }
      
  return timesReached
}

let PointsChangeTimeoutID
let pointChange = 0
let bitsChanged = false
function PointsChangeQueue(type, typeOfChange, change){
  switch(type){
    case "bits":{
      switch(typeOfChange){
        case "add":{
          pointChange = pointChange + bitsPointCalculation(change)
          bitsChanged = true
          break
        }
        case "remove":{
          pointChange = pointChange - bitsPointCalculation(change)
          bitsChanged = true
          break
        }
      }
      break
    }
    case "subs":{
      switch(typeOfChange){
        case "add":{
          pointChange = pointChange + change
          break
        }
        case "remove":{
          pointChange = pointChange - change
          break
        }
      }
      break
    }
    case "points":{
      switch(typeOfChange){
        case "add":{
          pointChange = pointChange + change
          break
        }
        case "remove":{
          pointChange = pointChange - change
          break
        }
      }
      break
    }
  }
  clearTimeout(PointsChangeTimeoutID)
  PointsChangeTimeoutID = setTimeout(()=>{
    if(pointChange === 0){
      if(bitsChanged){
        updateBitstxtFile()
        bitsChanged = false
      }
    }
    else if(pointChange > 0){
      addPoints(pointChange)
    }else{
      removePoints(Math.abs(pointChange))
    }
    pointChange = 0
    bitsChanged = false
  }, 333)
}

const removePoints = (change, writeToFile = true) => {
  data.points -= change
  if (data.points < 0) {
    data.goalCount -= 1
    let left = Math.abs(data.points)        
    data.points = data.goal
    if(left > 0){
      removePoints(left, false)
    }else{
      data.point = left
    }
  }
  if(writeToFile){
    fileWriteHandler()
    updateBitstxtFile()
  }
}

function calculateTimesReachedWithDifficulty(change){
  if(data.goal > change) return 0;
  
  let timesReached = 0
  let currentPoints = change

  while(currentPoints > 0){
    if(data.goal > currentPoints){
      data.points = currentPoints
      return timesReached
    }
    currentPoints -= data.goal
    timesReached += 1
    data.goal += data.difficultyPointIncrease
  }

  data.points = currentPoints
  return timesReached
}

function updateBitstxtFile(){
  if(!data.shouldWritetoBitsFile) return

  let bitsforGoal = data.goal * data.bitsToIncreasePoints
  let bitsToGoal = (data.points * data.bitsToIncreasePoints) + data.currentBitsAmount;
  let outstring = data.bitsTextFormat.replaceAll("${bitsToPoint}", data.currentBitsAmount).replaceAll("${bitsForPoint}", data.bitsToIncreasePoints).replaceAll("${bitsToGoal}", bitsToGoal).replaceAll("${bitsForGoal}", bitsforGoal).replaceAll("${points}", data.points).replaceAll("${goal}", data.goal).replaceAll("${goalCount}", data.goalCount)
  
  writeTextTofile("BitOutput.txt", outstring)
}

const addPoints = (change) => {
  data.points += change
  let timesReached = 0
  if(data.difficultyMode){
      timesReached = calculateTimesReachedWithDifficulty(data.points)
  }else{
    timesReached = Math.floor(data.points/data.goal)
    data.points = data.points%data.goal
  }
  if (timesReached >= 1) {
    data.goalCount += timesReached
    if(data.chatMessage !== "" && data.chatMessage !== null && data.chatMessage !== undefined){
      chat.say(data.channel, data.chatMessage.replaceAll("${points}", data.points).replaceAll("${goal}", data.goal).replaceAll("${goalCount}", data.goalCount)).catch((err) => {console.log(err)})
    }
    if(data.soundPath !== "" && data.soundPath !== null && data.soundPath !== undefined){
      PlaySoundFile()
    }
    fileWriteHandler()
    updateBitstxtFile()
  }else{
    fileWriteHandler()
    updateBitstxtFile()
  }
}

function PlaySoundFile() {
  sound.play(data.soundPath, data.soundVolume).catch((err) => {
    console.log("sound error:")
    console.log(err)
  })
}

function twitchEventsubCallback(message, type){
  if(type === "bits"){
    console.log(`${CurrentTime()}: From: ${message.user_name}, cheered: ${message.bits}`)
    PointsChangeQueue("bits", "add", message.bits)
  }else if(type === "channelPointsRedeems" && data.shouldchannelPointsRedeemsTrigger && data.channelPointsRedeemsTriggerList[message.reward.id]){
    console.log(`${CurrentTime()}: From: ${message.user_name}, redeemed: ${message.reward.title}`)
    PointsChangeQueue("points", data.channelPointsRedeemsTriggerList[message.reward.id].action, data.channelPointsRedeemsTriggerList[message.reward.id].points)
  }
}

async function HandleTwitchAuth(){
  if(data.token !== "TOKEN" || data.cheerMode !== "off" || data.chatMessage !== "" || data.shouldchannelPointsRedeemsTrigger){
      try {
        const tokens = await TwitchAuth.authenticate();
        if(data.cheerMode !== "off" || data.shouldchannelPointsRedeemsTrigger){
          TwitchEventsub.connectWS()
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
  }
}

function controlCommand(words){
  if (words.length === 1) {
    console.log(`${CurrentTime()}: ${data.controlCommandName} needs a parameter/option`)
    return
  }  
  switch(words[1].toLowerCase()){
    case("reset"):{
      resetGoal()
      break
    }
    case("p+"):{
      if(words.length === 2){
        PointsChangeQueue("points", "add", 1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        PointsChangeQueue("points", "add", Math.floor(words[2]))
      }
      else{
        PointsChangeQueue("points", "add", 1)
      }
      break
    }
    case("p-"):{
      if(words.length === 2){
        PointsChangeQueue("points", "remove", 1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        PointsChangeQueue("points", "remove", Math.floor(words[2]))
      }
      else{
        PointsChangeQueue("points", "remove", 1)
      }
      break
    }
    case("g+"):{
      if(words.length === 2){
        addGoals(1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        addGoals(Math.floor(words[2]))
      }
      else{
        addGoals(1)
      }
      break
    }
    case("g-"):{
      if(words.length === 2){
        removeGoals(1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        removeGoals(Math.floor(words[2]))
      }
      else{
        removeGoals(1)
      }
      break
    }
    default:{
      console.log(`${CurrentTime()}: ${words[1]} is not a valid option for ${data.controlCommandName}`)
      return
    }
  }
}

const CurrentTime = () => {
  return new Date().toLocaleTimeString()
}

const resetGoal = () => {
  data.points = 0
  data.goalCount = data.defaultGoalCount
  data.goal = data.defaultGoal
  data.currentBitsAmount = 0
  fileWriteHandler()
  updateBitstxtFile()
} 


const addGoals = (change) => {
  data.goalCount += change
  fileWriteHandler()
  updateBitstxtFile()
}


const removeGoals = (change) => {
  data.goalCount -= change
  fileWriteHandler()
  updateBitstxtFile()
}

const writeTextTofile = async (filename, text) => {

  await fs.writeFile(filename, text, function (err) {
    if (err){
      console.log(`${CurrentTime()}: file write error: `)
      console.log(err)
    }else{
      console.log(`${CurrentTime()}: ${filename} updated to: "${text.trim()}"`)
    }
  })
  save()
}

const fileWriteHandler = async () => {
    let outstring = data.outputString
    outstring = outstring.replaceAll("${points}", data.points).replaceAll("${goal}", data.goal).replaceAll("${goalCount}", data.goalCount) 
    fs.writeFile("output.txt", outstring, function (err) {
      if (err){
        console.log(`${CurrentTime()}: file write error: `)
        console.log(err)
      }else{
        console.log(`${CurrentTime()}: output.txt updated to: "${outstring.trim()}"`)
      }
    })
    save()
}

const exit = () => {
  save()
  console.log("Exiting!")
  process.exit(0)
}


const test = (level) =>{
  hypeChatManager(level)
} 

const fullReset = async () => {
  const confirmed = await confirm({
    message: "This will fully reset your settings and quit. The next start will run setup again. Continue?",
    default: false,
  })
  if (confirmed) {
    data = defaultSettings
    saveAndExit()
  }
}

const playSound = () => {
  PlaySoundFile()
}

const channelPoints = async() => {
  await SetUpChannelPoints()
  console.log("Channel points set up")
}

function startCommandLoop() {
  commandLoopOpen = true
  commandRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
  })

  const runCommand = async (line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const match = trimmed.match(/^(\w+)(?:\((.*)\))?$/)
    if (!match) {
      console.log("Unknown input. Type commands() for help.")
      return
    }

    const [, name, argsStr] = match
    const args = argsStr
      ? argsStr.split(",").map((s) => {
          const v = s.trim().replace(/^["']|["']$/g, "")
          const n = Number(v)
          return Number.isNaN(n) ? v : n
        })
      : []

    commandRl.pause()
    try {
      switch (name) {
        case "addPoints":
          addPoints(args[0] ?? 0)
          break
        case "removePoints":
          removePoints(args[0] ?? 0)
          break
        case "addGoals":
          addGoals(args[0] ?? 1)
          break
        case "removeGoals":
          removeGoals(args[0] ?? 1)
          break
        case "resetGoal":
          resetGoal()
          break
        case "exit":
          exit()
          return
        case "fullReset":
          await fullReset()
          break
        case "commands":
          commands()
          break
        case "playSound":
          playSound()
          break
        case "test":
          test(args[0])
          break
        default:
          console.log(`Unknown command: ${name}. Type commands() for help.`)
      }
    } finally {
      if (commandLoopOpen && commandRl) {
        commandRl.resume()
      }
    }
  }

  commandRl.on("line", async (line) => {
    await runCommand(line).catch((err) => {
      console.error(err)
    }).finally(() => {
      if (commandLoopOpen && commandRl) {
        commandRl.prompt()
      }
    })
  })

  commandRl.on("close", () => {
    commandLoopOpen = false
    process.exit(0)
  })

  commandRl.prompt()
}

const commands = () => {
  console.log(`
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    addPoints(x) : add x number of points. 
    removePoints(x) : remove x number of points.
    addGoals(x) : add x number of goals reached.
    removeGoals(x) : remove x number of goals reached.
    resetGoal(): resets the multigoal.
    channelPoints(): sets up channel points redeems.
    exit() : End the program.
    fullReset(): Will fully reset your settings and quit out
    of the script, the next time you start it it will prompt 
    you for what settings you want again.
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  `)
}

load()
const TwitchAuth = new Auth(data, data.eventsub)
const TwitchAPI = new TAPI(data, TwitchAuth)
const TwitchEventsub = new eventsub(data, TwitchAuth, twitchEventsubCallback.bind(this))

{
  const httpServerPort = 8623
  /** @param {any[]} args */
  const log = (...args) => console.log("[HTTP Server]", ...args)
  /** @type {(res: http.ServerResponse, body: any, code?: number) => void} */
  const json = (res, body, code = 200) => {
    if(body instanceof Promise) throw new Error("JSON response body was a Promise")
    if(res.headersSent) throw new Error("Headers already sent")
    res.writeHead(code, { "Content-Type": "application/json" })
    res.end(JSON.stringify(body))
  }
  /** @type {(res: http.ServerResponse, message: string, code: number) => void} */
  const jsonError = (res, message, code) => {
    json(res, { success: false, code, message }, code)
  }
  /**
   * @typedef {(typeof http.IncomingMessage) & { parsedUrl: URL; }} IncomingMessageExtended
   * @typedef {(req: IncomingMessageExtended, res: http.ServerResponse) => any} RouteHandler
   */
  const serverRoutes = {
    /** @type {Record<string, Record<string, RouteHandler>>} */
    api: {
      points: {
        add(req, res) {
          let pointsChange = 1
          const pointsInput = req.parsedUrl.searchParams.get("points")
          if(pointsInput) {
            const value = parseInt(pointsInput, 10)
            if(Number.isNaN(value) && isFinite(value)) {
              pointsChange = Math.max(0, value)
            }
            else {
              log("Could not parse points input:", { pointsInput })
              jsonError(res, "Could not parse points", 400)
              return
            }
          }
          try {
            addPoints(pointsChange)
            json(res, { success: true })
          } catch(err) {
            log("Failed to add points:", { pointsChange }, err)
            jsonError(res, "Failed to add points", 500)
          }
        },
        remove(req, res) {
          let pointsChange = 1
          const pointsInput = req.parsedUrl.searchParams.get("points")
          if(pointsInput) {
            const value = parseInt(pointsInput, 10)
            if(Number.isNaN(value) && isFinite(value)) {
              pointsChange = Math.max(0, value)
            }
            else {
              log("Could not parse points input:", { pointsInput })
              jsonError(res, "Could not parse points", 400)
              return
            }
          }
          try {
            removePoints(pointsChange)
            json(res, { success: true })
          } catch(err) {
            log("Failed to remove points:", { pointsChange }, err)
            jsonError(res, "Failed to remove points", 500)
          }
        },
      },
      goals: {
        add(req, res) {
          let goalsChange = 1
          const goalsInput = req.parsedUrl.searchParams.get("goals")
          if(goalsInput) {
            const value = parseInt(goalsInput, 10)
            if(Number.isNaN(value) && isFinite(value)) {
              goalsChange = Math.max(0, value)
            }
            else {
              log("Could not parse goals input:", { goalsInput })
              jsonError(res, "Could not parse goals", 400)
              return
            }
          }
          try {
            addGoals(goalsChange)
            json(res, { success: true })
          } catch(err) {
            log("Failed to add goals:", { goalsChange }, err)
            jsonError(res, "Failed to add goals", 500)
          }
        },
        remove(req, res) {
          let goalsChange = 1
          const goalsInput = req.parsedUrl.searchParams.get("goals")
          if(goalsInput) {
            const value = parseInt(goalsInput, 10)
            if(Number.isNaN(value) && isFinite(value)) {
              goalsChange = Math.max(0, value)
            }
            else {
              log("Could not parse goals input:", { goalsInput })
              jsonError(res, "Could not parse goals", 400)
              return
            }
          }
          try {
            removeGoals(goalsChange)
            json(res, { success: true })
          } catch(err) {
            log("Failed to remove goals:", { goalsChange }, err)
            jsonError(res, "Failed to remove goals", 500)
          }
        },
        reset(req, res) {
          try {
            resetGoal()
            json(res, { success: true })
          } catch(err) {
            log("Failed to reset goal", err)
            jsonError(res, "Failed to reset goal", 500)
          }
        },
      }
    }
  }
  /**
   * @type {http.Server<IncomingMessageExtended, typeof http.ServerResponse>}
   */
  const httpServer = http.createServer((incomingReq, res) => {
    const url = new URL(`http://localhost:${httpServerPort}${incomingReq.url}`)
    const pathParts = url.pathname.replace(/\+/g, "%20")
      .split("/")
      .map(n => decodeURIComponent(n).trim())
      .filter(n => n)
    /** @type {IncomingMessageExtended} */
    // @ts-ignore
    const req = Object.assign(incomingReq, {
      parsedUrl: url
    })
    try {
      /** @type {(Record<string, Record<string, Record<string, RouteHandler>>> | Record<string, Record<string, RouteHandler>> | Record<string, RouteHandler>) | RouteHandler} */
      let routes = serverRoutes
      while(pathParts.length) {
        const part = pathParts.shift()
        if(!part || part in routes === false) {
          break
        }
        routes = routes[part]
        if(typeof routes === "function") {
          (/** @type {RouteHandler} */ (routes))(req, res)
          return
        }
      }
      if(routes && typeof routes === "object" && "index" in routes) {
        // @ts-ignore
        routes.index(req, res)
        return
      }
      jsonError(res, `Not Found: "${url.pathname}"`, 404)
    } catch(err) {
      log(err)
      jsonError(res, "Internal Server Error", 500)
    }
  })
  httpServer.listen(httpServerPort, "127.0.0.1", () => {
    log(`Listening on http://127.0.0.1:${httpServerPort}`)
  })
}

async function main() {
  
  if(!data.installed){
    await setup()
  }else{
    if(!data.version || data.version < 8){
      await update()
    }
  }
  
  const shouldReset = await confirm({
    message: "Do you want to reset the multigoal (points and goal count)?",
    default: false,
  })
  if(shouldReset){
    resetGoal()
  }
  await HandleTwitchAuth()
  execute()
  startCommandLoop()
}

main();


