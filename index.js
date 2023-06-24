/*
Twitch Multigoal

Copyright © <2022> <Victor Liljeholm>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

let fs = require("fs")
let sound = require("sound-play")
let question = require("readline-sync").question
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
  "pointsPerPrimeSubscription": 1,
  "pointsPerTier1Subscription": 1,
  "pointsPerTier2Subscription": 2,
  "pointsPerTier3Subscription": 3,
  "pointsPerGiftedTier1Subscription": 1,
  "pointsPerGiftedTier2Subscription": 2,
  "pointsPerGiftedTier3Subscription": 3,
  "shouldGiftedFromChannelCount": false,
  "cheerMode": "off",
  "pointsToAddPerCheer": 1,
  "bitsToIncreasePoints": 500,
  "controlCommandName": "!goaledit",
  "hypeChatsActive": false,
  "pointsForLevelONE": 0,
  "pointsForLevelTWO": 1,
  "pointsForLevelTHREE": 1,
  "pointsForLevelFOUR": 1,
  "pointsForLevelFIVE": 1,
  "pointsForLevelSIX": 1,
  "pointsForLevelSEVEN": 1,
  "pointsForLevelEIGHT": 1,
  "pointsForLevelNINE": 1,
  "pointsForLevelTEN": 1,
  "version": 1
};

let answer
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
const update = () =>{
  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    New version found
    -------------------------------------------------------------------------------------
    A new version have been found and a few new steps are needed to set up the new 
    features in this update.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
  if(!data.version){
    console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Hype Chat Settings
    -------------------------------------------------------------------------------------
    Time to set up points for hype chats, here you can choose if hype chats should count
    towards the multigoal and how much many points each level should give. The levels are
    the steps seen when creating a hype chat, leading to a new chat color.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)
    data.hypeChatsActive = question("Should Hype chats add to the multi-goal? (off/on): ").trim().toLowerCase()
    if(data.hypeChatsActive !== "off"){
      data.pointsForLevelONE = parseInt(question("how many points should a level 1 hype chat be worth?(number only): ").trim())
      data.pointsForLevelTWO = parseInt(question("how many points should a level 2 hype chat be worth?(number only): ").trim())
      data.pointsForLevelTHREE = parseInt(question("how many points should a level 3 hype chat be worth?(number only): ").trim())
      data.pointsForLevelFOUR = parseInt(question("how many points should a level 4 hype chat be worth?(number only): ").trim())
      data.pointsForLevelFIVE = parseInt(question("how many points should a level 5 hype chat be worth?(number only): ").trim())
      data.pointsForLevelSIX = parseInt(question("how many points should a level 6 hype chat be worth?(number only): ").trim())
      data.pointsForLevelSEVEN = parseInt(question("how many points should a level 7 hype chat be worth?(number only): ").trim())
      data.pointsForLevelEIGH = parseInt(question("how many points should a level 8 hype chat be worth?(number only): ").trim())
      data.pointsForLevelNINE = parseInt(question("how many points should a level 9 hype chat be worth?(number only): ").trim())
      data.pointsForLevelTEN = parseInt(question("how many points should a level 10 hype chat be worth?(number only): ").trim())
    } 
    data.version = 1 
  }
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

const setup = () =>{
  console.log(`
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Welcome to the setup of Twitch Multi goal and general settings
    -------------------------------------------------------------------------------------
    Time to set up some general settings for the multigoal. When setting up what should be
    written to the output.txt file you can use the following parameters:\n
    \${points} : current points.\n
    \${goal} : the goal set.\n
    \${goalCount} : numbers of time the goal has been reached. \n
    an example would be "\${points}/\${goal} points to reach goal number #\${goalCount}"
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.channel = question("What is your channel name?: ").trim().toLowerCase()
  data.defaultGoal = parseInt(question("How many points should be required to reach the goal?(number only): ").trim())
  data.goal = data.defaultGoal
  data.defaultGoalCount = parseInt(question("What count should the multigoal start at?: ").trim())
  data.goalCount = data.defaultGoalCount
  data.outputString = question("How should the text in output.txt be formated?: ").trim()

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
  data.pointsPerPrimeSubscription = parseInt(question("how many points should a prime (re)sub be worth? (numbers only): ").trim())
  data.pointsPerTier1Subscription = parseInt(question("how many points should a tier 1 (re)sub be worth? (numbers only): ").trim())
  data.pointsPerTier2Subscription = parseInt(question("how many points should a tier 2 (re)sub be worth? (numbers only): ").trim())
  data.pointsPerTier3Subscription = parseInt(question("how many points should a tier 3 (re)sub be worth? (numbers only): ").trim())

  data.pointsPerGiftedTier1Subscription = parseInt(question("\nhow many points should one tier 1 gift sub be worth? (numbers only): ").trim())
  data.pointsPerGiftedTier2Subscription = parseInt(question("how many points should one tier 2 gift sub be worth? (numbers only): ").trim())
  data.pointsPerGiftedTier3Subscription = parseInt(question("how many points should one tier 3 gift sub be worth? (numbers only): ").trim())

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
  data.cheerMode = question("What mode do you want for cheers (info above)? (off/accumulated/single): ").trim().toLowerCase()
  if(data.cheerMode !== "off"){
    data.bitsToIncreasePoints = parseInt(question("How much needs to be cheered to increase the points?(number only): ").trim())
    data.pointsToAddPerCheer = parseInt(question("How many points should be added when reached? (numbers only): ").trim())
  }

  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Hype Chat Settings
    -------------------------------------------------------------------------------------
    Time to set up points for hype chats, here you can choose if hype chats should count
    towards the multigoal and how much many points each level should give. The levels are
    the steps seen when creating a hype chat, leading to a new chat color.
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)
  data.hypeChatsActive = question("Should Hype chats add to the multi-goal? (off/on): ").trim().toLowerCase()
  if(data.hypeChatsActive !== "off"){
    data.pointsForLevelONE = parseInt(question("how many points should a level 1 hype chat be worth?(number only): ").trim())
    data.pointsForLevelTWO = parseInt(question("how many points should a level 2 hype chat be worth?(number only): ").trim())
    data.pointsForLevelTHREE = parseInt(question("how many points should a level 3 hype chat be worth?(number only): ").trim())
    data.pointsForLevelFOUR = parseInt(question("how many points should a level 4 hype chat be worth?(number only): ").trim())
    data.pointsForLevelFIVE = parseInt(question("how many points should a level 5 hype chat be worth?(number only): ").trim())
    data.pointsForLevelSIX = parseInt(question("how many points should a level 6 hype chat be worth?(number only): ").trim())
    data.pointsForLevelSEVEN = parseInt(question("how many points should a level 7 hype chat be worth?(number only): ").trim())
    data.pointsForLevelEIGH = parseInt(question("how many points should a level 8 hype chat be worth?(number only): ").trim())
    data.pointsForLevelNINE = parseInt(question("how many points should a level 9 hype chat be worth?(number only): ").trim())
    data.pointsForLevelTEN = parseInt(question("how many points should a level 10 hype chat be worth?(number only): ").trim())
  }

  console.log(`\n
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Chat settings
    -------------------------------------------------------------------------------------
    Do you want a chat message to appear when a goal has been reached? For that you need
    a seprate account from your channel account, with that account go grab a oauth token
    from https://twitchapps.com/tmi/, it will look something like this: 
    oauth:1h4x0s1svsga4aif40x47bnoaa26i4 , Enter the full thing when asked. When setting up
    the chat message format the following parameters can be used: \n
      \${points} = current points. \n
      \${goal} = the goal set. \n
      \${goalCount} = the number of times the goal has been reached. 
    -------------------------------------------------------------------------------------
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
  `)

  answer = question("do you want a chat message to appear when a goal is reached? (y/n): ").trim()
  if(answer.toLowerCase() === "y"){
    data.username = question("Account name of the account that will announce in chat (most be seprate from channel name): ").trim().toLowerCase()
    data.token = question("What is the full oath token for that account?: ").trim()
    data.chatMessage = question("What should the chat message say?: ").trim()
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

  answer = question("do you want a sound to play when a goal is reached? (y/n): ").trim()

  if(answer.toLowerCase() === "y"){
    data.soundPath = question("What is the full path to the soundfile you want to play?: ").trim()
    data.soundVolume = parseInt(question("Volume level (can be between 0 and 100): ").trim())/100
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
  data.controlCommandName = question("What should the controlCommandName be to control the multigoal?: ").trim()

  data.installed = true
  save()
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
  if(data.token && data.token !== "TOKEN"){
    tokenstring = "with token"
    chat = new tmi.Client(
      {
        identity: {
          username: data.username,
          password: data.token
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

  chat.connect().then(() => {
    console.log(`
      ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
      Connected to channel: ${data.channel} ${tokenstring}, ready to receive events! 
      If you want information on commands you can use in CMD type commands() \n
      ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n
    `)

    chat.removeAllListeners()

    fileWriteHandler()
    chat.on("raw_message", (msg) => {
      if(msg.tags){
        if(msg.tags["pinned-chat-paid-level"]){
          if(data.hypeChatsActive === "on"){
            console.log(`${CurrentTime()}: From: ${msg.tags["display-name"]}, hype chat: level ${msg.tags["pinned-chat-paid-level"]}`)
            switch(msg.tags["pinned-chat-paid-level"]){
              case "ONE":{
                if(data.pointsForLevelONE !== 0){
                  pointsHandler("add", data.pointsForLevelONE)
                }
                return
              }
              case "TWO":{
                if(data.pointsForLevelTWO !== 0){
                  pointsHandler("add", data.pointsForLevelTWO)
                }
                return
              }
              case "THREE":{
                if(data.pointsForLevelTHREE !== 0){
                  pointsHandler("add", data.pointsForLevelTHREE)
                }
                return
              }
              case "FOUR":{
                if(data.pointsForLevelONE !== 0){
                  pointsHandler("add", data.pointsForLevelFOUR)
                }
                return
              }
              case "FIVE":{
                if(data.pointsForLevelFIVE !== 0){
                  pointsHandler("add", data.pointsForLevelFIVE)
                }
                return
              }
              case "SIX":{
                if(data.pointsForLevelSIX !== 0){
                  pointsHandler("add", data.pointsForLevelSIX)
                }
                return
              }
              case "SEVEN":{
                if(data.pointsForLevelSEVEN !== 0){
                  pointsHandler("add", data.pointsForLevelSEVEN)
                }
                return
              }
              case "EIGHT":{
                if(data.pointsForLevelEIGHT !== 0){
                  pointsHandler("add", data.pointsForLevelEIGHT)
                }
                return
              }
              case "NINE":{
                if(data.pointsForLevelNINE !== 0){
                  pointsHandler("add", data.pointsForLevelNINE)
                }
                return
              }
              case "TEN":{
                if(data.pointsForLevelTEN !== 0){
                  pointsHandler("add", data.pointsForLevelTEN)
                }
                return
              }
            }
          }
        }
      }

    })

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

    chat.on("cheer", (channel, userstate, message) =>{
      if(data.cheerMode !== "off"){
        console.log(`${CurrentTime()}: From: ${userstate["display-name"]}, cheered: ${userstate["bits"]}`)
        bitsPointCalculation(parseInt(userstate["bits"]))
      }
      
    })


    chat.on("subscription", (channel, username, method, message, userstate) => {
      switch(userstate["msg-param-sub-plan"]){
        case "Prime":{
        pointsHandler("add", data.pointsPerPrimeSubscription)
        break
        }
        case("1000"):{
          pointsHandler("add", data.pointsPerTier1Subscription)
          break
        }
        case("2000"):{
          pointsHandler("add", data.pointsPerTier2Subscription)
          break
        }
        case("3000"):{
          pointsHandler("add", data.pointsPerTier3Subscription)
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
        pointsHandler("add", data.pointsPerPrimeSubscription)
        break
        }
        case("1000"):{
          pointsHandler("add", data.pointsPerTier1Subscription)
          break
        }
        case("2000"):{
          pointsHandler("add", data.pointsPerTier2Subscription)
          break
        }
        case("3000"):{
          pointsHandler("add", data.pointsPerTier3Subscription)
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
          pointsHandler("add", data.pointsPerGiftedTier1Subscription*giftMonths)
          break
        }
        case("2000"):{
          pointsHandler("add", data.pointsPerGiftedTier2Subscription*giftMonths)
          break
        }
        case("3000"):{
          pointsHandler("add", data.pointsPerGiftedTier3Subscription*giftMonths)
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

let totalCheered = 0
function bitsPointCalculation(bits){
  let timesReached = 0
  switch(data.cheerMode){
    default:
    case "off":{
      return
    }
    case "accumulated":{
      totalCheered += bits
      timesReached = Math.floor(totalCheered/data.bitsToIncreasePoints)
      if(timesReached >= 1){
        pointsHandler("add", timesReached*data.pointsToAddPerCheer)
        totalCheered = totalCheered%data.bitsToIncreasePoints
      }
      break;
    }
    case "single":{
      timesReached = Math.floor(bits/data.bitsToIncreasePoints)
      if(timesReached >= 1){
        pointsHandler("add", timesReached*data.pointsToAddPerCheer)
      }
      break;
    }
  }
}

function pointsHandler(typeOfChange, change){
  switch(typeOfChange){
    case "add":{
      addPoints(change)
      break;
    }
    case "remove":{
      removePoints(change)
      break
    }
  }

}

const removePoints = (change) => {
  data.points -= change
  if (data.points < 0) {
    data.goalCount -= 1
    let left = Math.abs(data.points)        
    data.points = data.goal
    if(left > 0){
      pointsHandler("remove", left)
    }else{
      data.point = left
    }
  }
  fileWriteHandler()
}

let timeoutID
const addPoints = (change) => {
  data.points += change
  let timesReached = Math.floor(data.points/data.goal)
  if (timesReached >= 1) {
    clearTimeout(timeoutID)
    timeoutID = setTimeout(() => {
      if(data.chatMessage !== "" && data.chatMessage !== null && data.chatMessage !== undefined){
        chat.say(data.channel, data.chatMessage.replaceAll("${points}", data.points).replaceAll("${goal}", data.goal).replaceAll("${goalCount}", data.goalCount)).catch((err) => {console.log(err)})
      }
      if(data.soundPath !== "" && data.soundPath !== null && data.soundPath !== undefined){
        sound.play(data.soundPath, data.soundVolume).catch((err)=>{
          console.log("sound error:")
          console.log(err)
        })
      }
      data.goalCount += timesReached

      data.points = data.points%data.goal
      fileWriteHandler()
    }, 333)
  }else{
    fileWriteHandler()
  }
}

function controlCommand(words){
  switch(words[1].toLowerCase()){
    case("reset"):{
      resetGoal()
      break
    }
    case("p+"):{
      if(words.length === 2){
        pointsHandler("add", 1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        pointsHandler("add", Math.floor(words[2]))
      }
      else{
        pointsHandler("add", 1)
      }
      break
    }
    case("p-"):{
      if(words.length === 2){
        pointsHandler("remove", 1)
      }
      else if(words.length === 3 && !isNaN(words[2])){
        pointsHandler("remove", Math.floor(words[2]))
      }
      else{
        pointsHandler("remove", 1)
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
  }
}

const CurrentTime = () => {
  return new Date().toLocaleTimeString()
}

const resetGoal = () => {
  data.points = 0
  data.goalCount = data.defaultGoalCount
  totalCheered = 0
  fileWriteHandler()
} 


const addGoals = (change) => {
  data.goalCount += change
  fileWriteHandler()
}


const removeGoals = (change) => {
  data.goalCount -= change
  fileWriteHandler()
}

const fileWriteHandler = () => {
    let outstring = data.outputString
    outstring = outstring.replaceAll("${points}", data.points).replaceAll("${goal}", data.goal).replaceAll("${goalCount}", data.goalCount) 
    fs.writeFile("output.txt", outstring, function (err) {
      if (err){
        console.log(`${CurrentTime()}: file write error: `)
        console.log(err)
      }else{
        console.log(`${CurrentTime()}:"${outstring}" written to output.txt`)
      }
    })
    save()
}

const exit = () => {
  save()
  console.log("Exiting!")
  process.exit(0)
}




const fullReset = () => {
  if(answer === "y"){
    data = defaultSettings
    saveAndExit()
  }
}

const commands = () => {
  console.log(`
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    addPoints(x) : add x number of points. 
    removePoints(x) : remove x number of points.
    addGoals(x) : add x number of goals reached.
    removeGoals(x) : remove x number of goals reached.
    resetGoal(): resets the multigoal.
    exit() : End the program.
    fullReset(): Will fully reset your settings and quit out
    of the script, the next time you start it it will prompt 
    you for what settings you want again.
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  `)
}

load()

if(!data.installed){
  setup()
}else{
  if(!data.version){
    update()
  }
  answer = question("Do you want to reset the multigoal (points and goal count)? (y/n): ")
  if(answer === "y"){
    resetGoal()
  }
}

execute()
