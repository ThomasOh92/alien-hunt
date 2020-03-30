let gameState = [];
let gameBoard = document.getElementById('game-board');
let userPositionRow = 0;
let userPositionColumn = 0;
let alienPositionRow = 8;
let alienPositionColumn = 8;
let lineOfSightArray;
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
////;
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
////
//Main Decision Logic
let userDecision = () => {
    //Resetting the display
    if (headsUpDisplay.contains(document.getElementById('move-button'))){
        headsUpDisplay.removeChild(document.getElementById('move-button'))
    }
    if (headsUpDisplay.contains(document.getElementById('attack-button'))){
        headsUpDisplay.removeChild(document.getElementById('attack-button'))
    }
    //Setting up
    currentStage = "user decision"
    headsUpDisplay.classList.remove('hidden');
    //Creating move button
    let moveButton = document.createElement('button');
    moveButton.id = "move-button";
    moveButton.innerText = "Move Soldier";
    headsUpDisplay.appendChild(moveButton);
    //attack button only displays if lineOfSight is true
    let attackButton = document.createElement('button');
    attackButton.id = "attack-button";
    attackButton.innerText = "Attack!";
    if (lineOfSight()){
        headsUpDisplay.appendChild(attackButton);
    }
    moveButton.addEventListener('click', soldierMove)
    attackButton.addEventListener('click', soldierAttack)
}

let soldierMove = () => {
    currentStage = "soldier move";
    //function to update game state and DOM displays
    //after updates, function will also trigger alien action function
    let moveAction = function() {
        //Remove previous stylings
        for (let i = userPositionRow - 2; i <= userPositionRow + 2; i++){
             for (let j = userPositionColumn - 2; j <= userPositionColumn + 2; j++){
                if (noCollision(i, j)){
                    let squareSpace = document.getElementById(`${i},${j}`);
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

let soldierAttack = () => {
    currentStage = "soldier attack";
    //attempt hit function
    alienAction()
}

let alienAction = () => {
    currentStage = "alien action"
    console.log("alien time")
    //if line of sight true, attack
    //else, alien move
    //trigger user decision function
    userDecision();
}

userDecision();