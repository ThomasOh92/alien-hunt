let clearGameStartScreen = () => {
    document.getElementById('start-screen').style.display = "none";
    document.body.style.flexWrap = "wrap";
}
document.getElementById('start-game-button').addEventListener('click', clearGameStartScreen)
///
let gameState = [];
let gameBoard = document.getElementById('game-board');
let userPositionRow = 0;
let userPositionColumn = 0;
let alienPositionRow = 8;
let alienPositionColumn = 8;
let lineOfSightArray;
let attackProbability;
///
let currentStage = "user decision";
let destinationRow = 0;
let destinationColumn = 0;
///
let headsUpDisplay = document.getElementById('heads-up-display')
//Generating initial game board and game state. Setting user's initial position in game state. Setting alien initial position
let gameStart = () => {
    for (let i = 0; i < 10; i++){
        let gameStateRow = [];
        gameState.push(gameStateRow);
        for (let k = 0; k < 10; k++){
            let gridItem = document.createElement('div');
            gridItem.className = "grid-item";
            gridItem.id = i + "," + k;
            gameBoard.appendChild(gridItem);
            gameStateRow.push(null);
        }
    }
    gameState[0][0] = "user";
    gameState[8][8] = "alien"
    for (let a = 2; a < 7; a++){
        gameState[a][4] = "wall";
        document.getElementById(`${a},${4}`).style.backgroundImage = "url('img/brick_wall.png')";
    }
}
//Display User
let displayUser = () => {
    let gameBoardPosition = document.getElementById(`${userPositionRow},${userPositionColumn}`)
    gameBoardPosition.style.backgroundImage = "url('img/soldier_face_right.png')"
}
//Display Alien
let displayAlien = () => {
    let gameBoardPosition = document.getElementById(`${alienPositionRow},${alienPositionColumn}`)
    gameBoardPosition.style.backgroundImage = "url('img/alien_idle_face_right.png')"
}
gameStart();
displayUser();
displayAlien()
////
//Helper functions
let lineOfSight = () => {
    lineOfSightArray = [];
    let x0 = userPositionColumn;
    let y0 = userPositionRow;
    let x1 = alienPositionColumn;
    let y1 = alienPositionRow;
    //Getting deltas
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    //Setting which direction the line shall traverse
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    //Don't fully understand the math below. Based of Bresenham's algorithm for drawing lines between two points
    let err = (dx > dy ? dx : -dy) / 2; //Decision variable to adjust coordinates
    while (true) {
        lineOfSightArray.push(gameState[y0][x0]);
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
    console.log(lineOfSightArray)
    if (lineOfSightArray.includes("wall")){
        return false;
    }
    return true;
    //if any of the squares are opaque, return false
    //return true
}

let wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

////
//Main Decision Logic
let userDecision = () => {
    //Resetting the display
    headsUpDisplay.innerHTML = ""
    //Setting up
    currentStage = "user decision"
    headsUpDisplay.classList.remove('hidden');
    //Creating move button
    let moveButton = document.createElement('button');
    moveButton.id = "move-button";
    moveButton.innerText = "Move Soldier";
    headsUpDisplay.appendChild(moveButton);
    //attack button and attack probability only display if lineOfSight is true
    let attackButton = document.createElement('button');
    let attackProbabilityDisplay = document.createElement('div');
    if (lineOfSight()){
        //attack button
        attackButton.id = "attack-button";
        attackButton.innerText = "Attack!";
        //attack probability
        attackProbability = 100 - (lineOfSightArray.length * 10);
        attackProbabilityDisplay.id = "attack-probability-display";
        attackProbabilityDisplay.innerText = "Your Attack Probability is: " + attackProbability + "%";
        //appending them
        headsUpDisplay.appendChild(attackButton);
        headsUpDisplay.appendChild(attackProbabilityDisplay)
    }
    moveButton.addEventListener('click', soldierMove)
    attackButton.addEventListener('click', soldierAttack)
}

let soldierMove = () => {
    currentStage = "soldier move";
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
        alienAction()
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

let noCollision = (futureRow, futureColumn) => {
    if (futureRow < 0 || futureRow > 9){
        return false;
    }
    if (futureColumn < 0 || futureColumn > 9){
        return false;
    }
    if (gameState[futureRow][futureColumn] != null ){
        return false;
    }
    return true;
}

let soldierAttack = async () => {
    currentStage = "soldier attack";
    let chance = Math.random() * 100;
    //hit message
    let hitMessage = document.createElement('div');
    hitMessage.innerText = "Congratulations! You killed the alien!"
    hitMessage.id = "hit-message"
    //play again button
    let playAgainButton = document.createElement('button');
    playAgainButton.id = "play-again-button"
    playAgainButton.innerText = "Play Again?"
    playAgainButton.addEventListener('click', resetGame)
    //miss message
    let missMessage = document.createElement('div');
    missMessage.id = "miss-message"
    missMessage.innerText = "You missed!";

    if (chance < attackProbability){
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_dom_shooting.png')";
        //Display hit gif
        document.getElementById('attack-button').classList.add('hidden')
        document.getElementById('move-button').classList.add('hidden')
        document.getElementById('attack-probability-display').classList.add('hidden')
        let hitGif = document.createElement('img')
        hitGif.id = "hit-gif"
        hitGif.src = "img/shooting.gif"
        headsUpDisplay.appendChild(hitGif)
        await wait(1000)
        hitGif.classList.add('hidden');
        headsUpDisplay.appendChild(hitMessage);
        headsUpDisplay.appendChild(playAgainButton);
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_face_right.png')";
        return;
     } else {
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_dom_shooting.png')";
        //Display miss gif
        document.getElementById('attack-button').classList.add('hidden')
        document.getElementById('move-button').classList.add('hidden')
        document.getElementById('attack-probability-display').classList.add('hidden')
        let missGif = document.createElement('img')
        missGif.id = "miss-gif"
        missGif.src = "img/missing_shot.gif"
        headsUpDisplay.appendChild(missMessage);
        headsUpDisplay.appendChild(missGif)
        await wait(4000);
        document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = "url('img/soldier_face_right.png')"
        }
    alienAction()
}

let alienAction = async () => {
    currentStage = "alien action"
    //Inform user that it is Alien's turn. 1 second
    headsUpDisplay.innerHTML = "";
    let alienMessage = document.createElement('div')
    alienMessage.innerText = "Its the Alien's turn!"
    alienMessage.id = "alien-message"
    headsUpDisplay.appendChild(alienMessage);
    await wait(1000);
    //Show alien move range. Inform user that Alien is thinking.
    for (let i = alienPositionRow - 2; i <= alienPositionRow + 2; i++){
        for (let j = alienPositionColumn - 2; j <= alienPositionColumn + 2; j++){
            if (noCollision(i, j)){
                let squareSpace = document.getElementById(`${i},${j}`);
                squareSpace.classList.add('selected-tile');
            }
        }
    }
    let thinkingAlien = document.createElement('img');
    thinkingAlien.src = "img/alien_thinking.gif";
    thinkingAlien.id = "thinking-alien-gif"
    headsUpDisplay.appendChild(thinkingAlien);
    alienMessage.innerText = "Alien is thinking"
    await wait(500);
    alienMessage.innerText = "Alien is thinking."
    await wait(600);
    alienMessage.innerText = "Alien is thinking.."
    await wait(700);
    alienMessage.innerText = "Alien is thinking..."
    await wait(800);
    //Alien makes his choice.
    headsUpDisplay.removeChild(thinkingAlien);
    //Remove alien move range
    alienMessage.innerText = "Alien has decided!"
    for (let i = alienPositionRow - 2; i <= alienPositionRow + 2; i++){
        for (let j = alienPositionColumn - 2; j <= alienPositionColumn + 2; j++){
            if (noCollision(i, j)){
                let squareSpace = document.getElementById(`${i},${j}`);
                squareSpace.classList.remove('selected-tile');
            }
        }
    }
    await wait(2000);
    if (lineOfSight()){ //Alien attack
        alienMessage.innerText = "Alien will attack!"
        document.getElementById(`${alienPositionRow},${alienPositionColumn}`).style.backgroundImage = "url('img/alien_dom_shooting.png')"
        let shootingAlien = document.createElement('img');
        shootingAlien.src = "img/alien_shooting.gif";
        shootingAlien.id = "shooting-alien-gif";
        headsUpDisplay.appendChild(shootingAlien);
        //alien choosing to shoot gif
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
            //exit the function
            document.getElementById(`${alienPositionRow},${alienPositionColumn}`).style.backgroundImage = "url('img/alien_idle_face_right.png')"
            return
        } else {
            let alienMissGif = document.createElement('img');
            alienMissGif.id = "alien-miss-gif";
            alienMissGif.src = "img/alien_miss.gif";
            headsUpDisplay.appendChild(alienMissGif);
            alienMessage.innerText = "The Alien Missed!"
            await wait(2000);
            headsUpDisplay.removeChild(alienMissGif);
            document.getElementById(`${alienPositionRow},${alienPositionColumn}`).style.backgroundImage = "url('img/alien_idle_face_right.png')";
        }
    } else{ //Alien move
        alienMessage.innerText = "Alien will move!"
        let walkingAlien = document.createElement('img');
        walkingAlien.src = "img/alien_walking.gif";
        walkingAlien.id = "walking-alien-gif";
        headsUpDisplay.appendChild(walkingAlien);
        await wait(2000);
        moveAlien();
        await wait(1000);
        moveAlien();
        await wait(1000);
        headsUpDisplay.removeChild(walkingAlien);
    }

    alienMessage.innerText = "Its your turn now!"
    await wait(2000)
    userDecision();
}

let moveAlien = () => {
    //Remove current alien display
    document.getElementById(`${alienPositionRow},${alienPositionColumn}`).style.backgroundImage = "";
    //While true loop, randomized direction
    while (true){
        let randomDirectionNumber = Math.floor((Math.random() * 4) + 1)
        //Direction Up
        if (randomDirectionNumber === 1 && alienPositionRow != 0 && gameState[alienPositionRow - 1][alienPositionColumn] === null){
            gameState[alienPositionRow - 1][alienPositionColumn] = "alien";
            gameState[alienPositionRow][alienPositionColumn] = null;
            alienPositionRow--;
            break;
        }
        //Direction Down
        else if (randomDirectionNumber === 2 && alienPositionRow != 9 && gameState[alienPositionRow + 1][alienPositionColumn] === null){
            gameState[alienPositionRow + 1][alienPositionColumn] = "alien";
            gameState[alienPositionRow][alienPositionColumn] = null;
            alienPositionRow++
            break
        }
        //Direction Left
        else if (randomDirectionNumber === 3 && alienPositionColumn != 0 && gameState[alienPositionRow][alienPositionColumn - 1] === null){
            gameState[alienPositionRow][alienPositionColumn - 1] = "alien";
            gameState[alienPositionRow][alienPositionColumn] = null;
            alienPositionColumn--;
            break
        }
        //Direction Right
        else if (randomDirectionNumber === 4 && alienPositionColumn != 9 ** gameState[alienPositionRow][alienPositionColumn + 1] === null) {
            gameState[alienPositionRow][alienPositionColumn + 1] = "alien";
            gameState[alienPositionRow][alienPositionColumn] = null;
            alienPositionColumn++;
            break
        }
        //Keep going until you get a direction
        else {
            continue;
        }
    }
    displayAlien()
}

let resetGame = () => {
    //Clear user and alien of the DOM
    document.getElementById(`${userPositionRow},${userPositionColumn}`).style.backgroundImage = ""
    document.getElementById(`${alienPositionRow},${alienPositionColumn}`).style.backgroundImage = ""
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
    gameState[8][8] = "alien"
    userPositionRow = 0;
    userPositionColumn = 0;
    alienPositionRow = 8;
    alienPositionColumn = 8;
    for (let a = 2; a < 7; a++){
        gameState[a][4] = "wall";
    }
    currentLevel = 0;
    //Display again, back to user decision
    displayUser();
    displayAlien();
    userDecision();
}

userDecision();
//hello