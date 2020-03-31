let currentLevel = 0;
let alienLocations = [] // array of array containing all the alien locations

let nextLevelReset = () =>{
    currentStage = "next level reset"
    currentLevel++;
    document.getElementById(`level-display`).innerText = `Level ${currentLevel + 1}`
    alienLocations = [];
    //Clear DOM
    for (let i = 0; i < 10; i++){
        for (let j = 0; j < 10; j++){
            document.getElementById(`${i},${j}`).style.backgroundImage = ""
        }
    }
    //Clear Heads Up Display Children
    headsUpDisplay.innerHTML = "";
    //Reset Game state
    gameState = [];
    for (let i = 0; i < 10; i++){
        let gameStateRow = [];
        gameState.push(gameStateRow);
        for (let k = 0; k < 10; k++){
            gameStateRow.push(null);
        }
    }
    gameState[0][0] = "user";
    //generate and place level + 1 aliens. Game state and DOM
    for (let i = 0; i <= currentLevel; i++){
        gameState[8][8 - i] = "alien";
        document.getElementById(`8,${8 - i}`).style.backgroundImage = "url('img/alien_idle_face_right.png')";
        alienLocations.push([8, 8 - i])
    }
    for (let a = 2; a < 7; a++){
        gameState[a][4] = "wall";
        document.getElementById(`${a},${4}`).style.backgroundImage = "url('img/brick_wall.png')";
    }
    //Display user
    userPositionRow = 0;
    userPositionColumn = 0;
    displayUser();
    //Display multiple aliens
    userDecisionMA();
}

let lineOfSightGeneric = (alienRow, alienCol) => {
    let newLineOfSightArray = [];
    let x0 = userPositionColumn;
    let y0 = userPositionRow;
    let x1 = alienCol;
    let y1 = alienRow;
    //Getting deltas
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    //Setting which direction the line shall traverse
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    //Don't fully understand the math below. Based of Bresenham's algorithm for drawing lines between two points
    let err = (dx > dy ? dx : -dy) / 2; //Decision variable to adjust coordinates
    while (true) {
        newLineOfSightArray.push(gameState[y0][x0]);
        if (x0 === x1 && y0 === y1) {
            break;
        }
        if (err > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (x0 === x1 && y0 === y1) {
            break;
        }
        if (err < dy) {
            err += dx;
            y0 += sy;
        }
        if (x0 === x1 && y0 === y1) {
            break;
        }
    }
    if (newLineOfSightArray.includes("wall")){
        return false;
    }
    return true;
}

let lineOfSightMA = () =>{
    //line of sight for multiple aliens
    let visibleAliens = [];
    //loop through game state and check for aliens
    for (let i = 0; i < 10; i++){
        for (let j = 0; j < 10; j++){
            if (gameState[i][j] === "alien" && lineOfSightGeneric(i, j)){
                visibleAliens.push([i, j])
            }
        }
    }
    return visibleAliens;
}

let userDecisionMA = () => {
    currentStage = "user decision multiple alien"
    headsUpDisplay.classList.remove('hidden');
    //Resetting the display
    headsUpDisplay.innerHTML = ""
    //Creating move button
    let moveButton = document.createElement('button');
    moveButton.id = "move-button";
    moveButton.innerText = "Move Soldier";
    headsUpDisplay.appendChild(moveButton);
    moveButton.addEventListener('click', soldierMoveMA)
    //attack button and attack probability only display for each different alien
    let visibleAliens = lineOfSightMA(); // returns array of arrays. [[alien1row,alien1col], [alien2row,alien2col]...]
    //Generate an attack button and attack probability for each item in the visible aliens array
    for (let i = 0; i < visibleAliens.length; i++){
        let attackDisplay = document.createElement('div')
        let attackButton = document.createElement('button');
        let attackProbabilityDisplay = document.createElement('div');
        attackButton.classList.add("attack-buttons");
        attackButton.innerText = "Attack Alien at Grid Spot " + visibleAliens[i].toString();
        //attack probability based on distance to alien
        let a = (visibleAliens[i][1] - userPositionColumn);
        let b = (visibleAliens[i][0] - userPositionRow);
        let attackDistance = Math.floor(Math.sqrt((a * a) + (b * b)));
        let attackProbability = 100 - (attackDistance * 10);
        attackProbabilityDisplay.id = "attack-probability-display";
        attackProbabilityDisplay.innerText = "Your Attack Probability is: " + attackProbability + "%";
        //appending
        attackDisplay.appendChild(attackButton);
        attackDisplay.appendChild(attackProbabilityDisplay);
        headsUpDisplay.appendChild(attackDisplay);
        let triggerAttack = () => {
            soldierAttackMA(attackProbability, visibleAliens[i]);
        }
        attackButton.addEventListener('click', triggerAttack);
    }
}

let soldierMoveMA = () => {
    currentStage = "soldier move multiple alien";
        //function to update game state and DOM displays
    //after updates, function will also trigger alien action function
    let moveAction = function() {
        //Remove previous stylings and listeners
        for (let i = userPositionRow - 2; i <= userPositionRow + 2; i++){
             for (let j = userPositionColumn - 2; j <= userPositionColumn + 2; j++){
                if (noCollision(i, j)){
                    let squareSpace = document.getElementById(`${i},${j}`);
                    squareSpace.removeEventListener('click', moveAction);
                    squareSpace.classList.remove('selected-tile');
                }
            }
        }
        //Clear user's previous spot in DOM
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "";
        //Clear user's previous spot in game state
        gameState[userPositionRow][userPositionColumn] = null;
        //Getting new coordinates
        let newRow = this.id.split(",").map(x => parseInt(x))[0];
        let newColumn = this.id.split(",").map(x => parseInt(x))[1];
        //Set user's new spot in the game state base on coordinates in the array
        gameState[newRow][newColumn] = "user";
        userPositionRow = newRow;
        userPositionColumn = newColumn;
        //Set user's new spot in DOM --- this.backgroundImage = that pic
        this.style.backgroundImage = "url('img/soldier_face_right.png')";
        //trigger for alien action
        alienActionMA()
    }
    //loop to add event listeners to all squares within 3 spaces. When clicked, function will update the game state and DOM displays
    for (let i = userPositionRow - 2; i <= userPositionRow + 2; i++){
         for (let j = userPositionColumn - 2; j <= userPositionColumn + 2; j++){
            if (noCollision(i, j)){
                let squareSpace = document.getElementById(`${i},${j}`);
                squareSpace.addEventListener('click', moveAction);
                squareSpace.classList.add('selected-tile');
            }
        }
    }
}

let soldierAttackMA = async (attackChance, alienCoords) => {
    currentStage = "soldier attack, there are multiple aliens";
    let chance = Math.random() * 100;
    //hit message
    let hitMessage = document.createElement('div');
    hitMessage.innerText = "Congratulations! You killed the alien!"
    hitMessage.id = "hit-message"
    //miss message
    let missMessage = document.createElement('div');
    missMessage.id = "miss-message"
    missMessage.innerText = "You missed!";
    //if hit
    if (chance < attackProbability){
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_dom_shooting.png')";
        //Display hit gif
        headsUpDisplay.innerHTML = "";
        let hitGif = document.createElement('img')
        hitGif.id = "hit-gif"
        hitGif.src = "img/shooting.gif"
        headsUpDisplay.appendChild(hitGif)
        await wait(1000)
        hitGif.classList.add('hidden');
        headsUpDisplay.appendChild(hitMessage);
        headsUpDisplay.appendChild(playAgainButton);
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_face_right.png')";
        //clearing alien game state and DOM
        gameState[alienCoords[0]][alienCoords[1]] = null;
        document.getElementById(`${alienCoords[0]},${alienCoords[1]}`).style.backgroundImage = "url('img/alien_dead.png')";
        await wait(2000)
        document.getElementById(`${alienCoords[0]},${alienCoords[1]}`).style.backgroundImage = "";
        return;
     } else {
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_dom_shooting.png')";
        //Display miss gif
        headsUpDisplay.innerHTML = "";
        let missGif = document.createElement('img')
        missGif.id = "miss-gif"
        missGif.src = "img/missing_shot.gif"
        headsUpDisplay.appendChild(missMessage);
        headsUpDisplay.appendChild(missGif)
        await wait(4000);
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_face_right.png')"
     }
     checkWin();
}

let checkWin = () => {
    currentStage = "check win";
    for (let i = 0; i < 10; i++){
        for (let j = 0; j < 10; j++){
            if (gameState[i][j] === "alien") {
                headsUpDisplay.innerHTML = "";
                let messageDisplay = document.createElement('div');
                messageDisplay.id = "message-display"
                messageDisplay.innerText = "You've beaten this level!"
                let nextLevelButton = document.createElement('button');
                nextLevelButton.id = "next-level-button";
                nextLevelButton.innerText = "Next Level?"
                nextLevelButton.addEventListener('click', nextLevelReset);
                headsUpDisplay.appendChild(messageDisplay);
                headsUpDisplay.appendChild(nextLevelButton);
            }
        }
    }
    alienActionMA();
}

let alienActionMA = async () => {
    currentStage = "multiple alien action"
    //Inform user that its the aliens' turn, and they are thinking
    headsUpDisplay.innerHTML = "";
    let alienMessage = document.createElement('div')
    alienMessage.innerText = "Its time for the Aliens to make their move!"
    alienMessage.id = "alien-message"
    headsUpDisplay.appendChild(alienMessage);
    await wait(1000);
    let thinkingAlien = document.createElement('img');
    thinkingAlien.src = "img/alien_thinking.gif";
    thinkingAlien.id = "thinking-alien-gif"
    headsUpDisplay.appendChild(thinkingAlien);
    alienMessage.innerText = "The Aliens are thinking"
    await wait(500);
    alienMessage.innerText = "The Aliens are thinking."
    await wait(600);
    alienMessage.innerText = "The Aliens are thinking.."
    await wait(700);
    alienMessage.innerText = "The Aliens are thinking..."
    await wait(800);
    headsUpDisplay.removeChild(thinkingAlien);
    alienMessage.innerText = "The Aliens have decided!"
    //loop through the alien location array
    for (let i = 0; i < alienLocations.length; i++){
        //if alien, at specific location, has line of sight
            //alien DOM spot - add a div with a translucent green color bg-     position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            //alien attacks
            //alien DOM spot - remove div with the color
        //else, that specific alien moves
            //update relevant DOM
            //update relevant game state
        if (lineOfSightGeneric(alienLocations[i][0], alienLocations[i][1])){
            //alien DOM spot - add div with translucent green
            let highlightedLayer = document.createElement('div');
            highlightedLayer.classList.add('highlighted-layer');
            document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).appendChild(highlightedLayer);
            //alien attacks
            alienMessage.innerText = "Alien is attacking!"
            document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).style.backgroundImage = "url('img/alien_dom_shooting.png')"
            let shootingAlien = document.createElement('img');
            shootingAlien.src = "img/alien_shooting.gif";
            shootingAlien.id = "shooting-alien-gif";
            headsUpDisplay.appendChild(shootingAlien);
            await wait(2000);
            headsUpDisplay.removeChild(shootingAlien);
            //Run probability mechanics
            let chance = Math.random() * 100;
            if (chance < attackProbability) { // if hit
                let alienHitGif = document.createElement('img');
                alienHitGif.id = "alien-hit-gif";
                alienHitGif.src = "img/alien_hit.gif";
                headsUpDisplay.appendChild(alienHitGif);
                alienMessage.innerText = "Its a hit!"
                await wait(2000);
                //Clear display and show play again  button
                headsUpDisplay.removeChild(alienHitGif);
                alienMessage.innerText = "Game Over...";
                let playAgainButton = document.createElement('button');
                playAgainButton.id = "play-again-button"
                playAgainButton.innerText = "Play Again?"
                playAgainButton.addEventListener('click', resetGame);
                headsUpDisplay.appendChild(playAgainButton);
                //Resetting DOM alien
                document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).removeChild(highlightedLayer);
                document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).style.backgroundImage = "url('img/alien_idle_face_right.png')"
            } else {
                let alienMissGif = document.createElement('img');
                alienMissGif.id = "alien-miss-gif";
                alienMissGif.src = "img/alien_miss.gif";
                headsUpDisplay.appendChild(alienMissGif);
                alienMessage.innerText = "The Alien Missed!"
                await wait(2000);
                headsUpDisplay.removeChild(alienMissGif);
                document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).removeChild(highlightedLayer);
                document.getElementById(`${alienLocations[i][0]},${alienLocations[i][1]}`).style.backgroundImage = "url('img/alien_idle_face_right.png')";
            }
        } else {
            alienMessage.innerText = "Alien will move!"
            let walkingAlien = document.createElement('img');
            walkingAlien.src = "img/alien_walking.gif";
            walkingAlien.id = "walking-alien-gif";
            headsUpDisplay.appendChild(walkingAlien);
            await wait(2000);
            moveSpecificAlien(alienLocations[i][0], alienLocations[i][1], alienLocations[i]);
            await wait(2000);
            headsUpDisplay.removeChild(walkingAlien);
        }
    }
    alienMessage.innerText = "Its your turn now!"
    await wait(2000)
    userDecisionMA();
}

let moveSpecificAlien = (alienRow, alienCol, arr) =>{
    //Remove current alien display
    document.getElementById(`${alienRow},${alienCol}`).style.backgroundImage = "";
    console.log(arr)
    //While true loop, randomized direction
    while (true){
        let randomDirectionNumber = Math.floor((Math.random() * 4) + 1)
        //Direction Up
        if (randomDirectionNumber === 1 && alienRow != 0 && gameState[alienRow - 1][alienCol] === null){
            gameState[alienRow - 1][alienCol] = "alien";
            gameState[alienRow][alienCol] = null;
            document.getElementById(`${alienRow - 1},${alienCol}`).style.backgroundImage = "url('img/alien_idle_face_right.png')";
            arr[0]--
            break;
        }
        //Direction Down
        else if (randomDirectionNumber === 2 && alienRow != 9 && gameState[alienRow + 1][alienCol] === null){
            gameState[alienRow + 1][alienCol] = "alien";
            gameState[alienRow][alienCol] = null;
            document.getElementById(`${alienRow + 1},${alienCol}`).style.backgroundImage = "url('img/alien_idle_face_right.png')"
            arr[0]++
            break
        }
        //Direction Left
        else if (randomDirectionNumber === 3 && alienCol != 0 && gameState[alienRow][alienCol - 1] === null){
            gameState[alienRow][alienCol - 1] = "alien";
            gameState[alienRow][alienCol] = null;
            document.getElementById(`${alienRow},${alienCol - 1}`).style.backgroundImage = "url('img/alien_idle_face_right.png')"
            arr[1]--
            break
        }
        //Direction Right
        else if (randomDirectionNumber === 4 && alienCol != 9 ** gameState[alienRow][alienCol + 1] === null) {
            gameState[alienRow][alienCol + 1] = "alien";
            gameState[alienRow][alienCol] = null;
            document.getElementById(`${alienRow},${alienCol + 1}`).style.backgroundImage = "url('img/alien_idle_face_right.png')"
            arr[1]++
            break
        }
        //Keep going until you get a direction
        else {
            continue;
        }
    }
}

document.getElementById('skip-level-button').addEventListener('click', nextLevelReset);