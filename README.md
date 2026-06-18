## What is Twitch Multigoal?
A simple script I wrote for a few friends that wanted interactivity with their community by having a goal that could be reached multiple time
over a stream. With subscriptions (normal or gifted), hype chats and cheers the chat can collectivly colllect points toward the set goal. Up
to you what the reward is for reaching the goal, but when a goal is reached it resets and starts all over again, now also with the option to
increase the goal each time it has been reached.

The scripts allow you to set up the points value for subs, hype chats, redeems and cheers and also what the goal is. It also supports:
- Sound when the goal has been reached.
- Chat message when the goal has ben reached.
- A way to show the progress on stream with a text file.


## Getting Started

- install Node [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

- Once installed unzip the multigoal folder gotten from the release page.
  - go into the folder and click the file:

    `installer.bat` 


- When install is done you can close the CMD window, to start the program you can now click the file:

  `start.bat`

- From here you will get steps in the CMD window for setting up Multigoal
  - This window this needs to be remain open to have the multigoal script running.

If you want the Multigoal printed to the screen, use a text source and point it towards output.txt and it will be updated automatically. 
For the setting up part I'm doing very litle input checking so make sure you use the correct input type, as in when it says "numbers only"
only use 1-9. 

## Updating
  - unzip the multigoal folder gotten from the release page.
  
  - Copy over and replace the files from this new folder to your old folder for the script.

  - As usual go into the folder and click:
  
    `start.bat`

    you will now be prompted with new settings option the first time.



# Http API(v2.7 and later)
If you enable the HTTP API you can now control this script from an external source, with the following HTTP JSON API.
Thanks to [@AlcaDesign](https://github.com/AlcaDesign)

For the examples replace {port} with the port you selected.

## Points

### `/api/points/{add|remove}`

Add or remove points to the total. This is the same as using `addPoints(n)` or `removePoints(n)` (where `n` is 1 or more).

Parameter | Type | Required | Default | Description
----------|------|----------|---------|--------------
points    | int  | no       | 1       | How many points to add/remove. Does not accept negative numbers.

### Examples:
- `http://localhost:{port}/api/points/add` - Add 1 point
- `http://localhost:{port}/api/points/add?points=10` - Add 10 points
- `http://localhost:{port}/api/points/remove` - Remove 1 point
- `http://localhost:{port}/api/points/remove?points=10` - Remove 10 points

### Responses:

Code | Status                | Body
-----|-----------------------|------
200  | OK                    | `{ "success": true }`
400  | Bad Request           | `{ "success": false, "code": 400, "message": "Could not parse points" }`
500  | Internal Server Error | `{ "success": false, "code": 500, "message": "Failed to add points" }`
500  | Internal Server Error | `{ "success": false, "code": 500, "message": "Failed to remove points" }`

## Goals

### `/api/goals/{add|remove}`

Add or remove goals to the total. This is the same as using `addGoals(n)` or `removeGoals(n)` (where `n` is 1 or more).

Parameter | Type | Required | Default | Description
----------|------|----------|---------|--------------
goals     | int  | no       | 1       | How many goals to add/remove. Does not accept negative numbers.

#### Examples:
- `http://localhost:{port}/api/goals/add` - Add 1 point
- `http://localhost:{port}/api/goals/add?goals=10` - Add 10 goals
- `http://localhost:{port}/api/goals/remove` - Remove 1 point
- `http://localhost:{port}/api/goals/remove?goals=10` - Remove 10 goals

Code | Status                | Body
-----|-----------------------|------
200  | OK                    | `{ "success": true }`
400  | Bad Request           | `{ "success": false, "code": 400, "message": "Could not parse goals" }`
500  | Internal Server Error | `{ "success": false, "code": 500, "message": "Failed to add goals" }`
500  | Internal Server Error | `{ "success": false, "code": 500, "message": "Failed to remove goals" }`

### `/api/goals/reset`

Reset the goals, points, and bits. This is the same as using `resetGoal()`

#### Examples:
- `http://localhost:{port}/api/goals/reset` - Reset the goals

Code | Status                | Body
-----|-----------------------|------
200  | OK                    | `{ "success": true }`
500  | Internal Server Error | `{ "success": false, "code": 500, "message": "Failed to reset goals" }`