// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(800,800);
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// aliases
let stage;

// game variables
let startScene;
let gameScene,tank1,tank2,scoreLabel1,playerLabel1,scoreLabel2,playerLabel2,gameOverScoreLabel,shootSound,hitSound,fireballSound;
let gameOverScene;

//keyboard variables
let keyPressed = [];

//tank variables
let tank1FireTimer = 0;
let tank2FireTimer = 0;

let walls = [];
let bullets = [];
let explosions = [];
let explosionTextures;
let score1 = 0;
let score2 = 0;
let paused = true;
let numBullets = 1;
let rotateSpeed = Math.PI/72;
let speed = 3;
let fireInterval = 0.3;
let endDelay = 0;
let wallNum = 50;

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);
    
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

	// #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);
	
	// #4 - Create labels for all 3 scenes
    createLabelsAndButtons();
    
	// #6 - Load Sounds
	shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });
    
    hitSound = new Howl({
        src: ['sounds/hit.mp3']
    });
    
    fireballSound = new Howl({
        src: ['sounds/fireball.mp3']
    });
    
	// #7 - Load sprite sheet
    explosionTextures = loadSpriteSheet();
		
	// #8 - Start update loop
    app.ticker.add(gameLoop);
    
    //Keyboard input
    document.addEventListener('keydown', function(e) {       
        keyPressed[e.keyCode] = true;
    });
                              
    document.addEventListener('keyup', function(e) {
        keyPressed[e.keyCode] = false;
    });
    
    //initialize variables
    score1 = 0;
    score2 = 0;
}

function createLabelsAndButtons(){
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 48,
        fontFamily: 'Audiowide'
    });
    
    let startLabel1 = new PIXI.Text("BALLISTIC");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xDD0000,
        fontSize: 96,
        fontFamily: 'Audiowide',
        stroke: 0xBBBBBB,
        strokeThickness: 3
    });
    startLabel1.anchor.x = 0.5;
    startLabel1.x = sceneWidth/2;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);
    
    let startLabel2 = new PIXI.Text("By Will Dickinson and David Liu");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xDD0000,
        fontSize: 32,
        fontFamily: 'Audiowide',
        stroke: 0xBBBBBB,
        strokeThickness: 1,
        anchor: 0.5
    });
    startLabel2.anchor.x = 0.5;
    startLabel2.x = sceneWidth/2;
    startLabel2.y = sceneHeight/2;
    startScene.addChild(startLabel2);
    
    let startButton = new PIXI.Text("PLAY");
    startButton.style = buttonStyle;
    startButton.anchor.x = 0.5;
    startButton.x = sceneWidth/2;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on("pointerover", e=>e.target.alpha = 0.7, e=>e.target.style.backgroundColor = 0xDD0000);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1);
    startScene.addChild(startButton);
    
    
    // 2 - set up `gameScene`    
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: 'Audiowide',
        stroke: 0xFF0000,
        strokeThickness: 4
    });
    
    scoreLabel1 = new PIXI.Text();
    scoreLabel1.style = textStyle;
    scoreLabel1.anchor.x = 0.5;
    scoreLabel1.x = 50;
    scoreLabel1.y = 26;
    gameScene.addChild(scoreLabel1);
    increaseScoreBy(0, 1);
    
    playerLabel1 = new PIXI.Text("Player 1");
    playerLabel1.style = textStyle;
    playerLabel1.anchor.x = 0.5;
    playerLabel1.x = 50;
    playerLabel1.y = 6;
    gameScene.addChild(playerLabel1);
    
    scoreLabel2 = new PIXI.Text();
    scoreLabel2.style = textStyle;
    scoreLabel2.anchor.x = 0.5;
    scoreLabel2.x = sceneWidth - 50;
    scoreLabel2.y = 26;
    gameScene.addChild(scoreLabel2);
    increaseScoreBy(0, 2);
    
    playerLabel2 = new PIXI.Text("Player 2");
    playerLabel2.style = textStyle;
    playerLabel2.anchor.x = 0.5;
    playerLabel2.x = sceneWidth - 50;
    playerLabel2.y = 5;
    gameScene.addChild(playerLabel2);
    
    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!\n        :-O");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: 'Audiowide',
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 100;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);

    gameOverScoreLabel = new PIXI.Text();
    gameOverScoreLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 32,
        fontFamily: 'Audiowide',
        stroke: 0xFF0000,
        strokeThickness: 4
    });
    gameOverScoreLabel.x = 135;
    gameOverScoreLabel.y = sceneHeight/2 + 50;
    gameOverScene.addChild(gameOverScoreLabel);

    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Play Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 150;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",startGame); // startGame is a function reference
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);
}

function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    paused = false;
    
    //Create player 1
	tank1 = new Tank();
    tank1.rotation -= Math.PI/2;
    gameScene.addChild(tank1);
    
    //Create player 2
	tank2 = new Tank("tank_blue.png");
    tank2.rotation -= Math.PI/2;
    gameScene.addChild(tank2);
    
    // Create walls
    if(walls.length != (wallNum * 2)){
        for(let i = 0; i < wallNum; i++){
            drawHorizontalWall();
        }
        for(let i = 0; i < wallNum; i++){
            drawVerticalWall();
        }   
    }
    
    tank1.x = 0;
    tank1.y = 800;
    tank2.x = 800;
    tank2.y = 800;
}

function increaseScoreBy(value, player){
    if(player == 1){
        score1 += value;
    
        if(score1 >= 5)
            numBullets = 3;

        scoreLabel1.text = `Score ${score1}`;
    }
    else if(player == 2){
        score2 += value;
    
        if(score2 >= 5)
            numBullets = 3;

        scoreLabel2.text = `Score ${score2}`;
    }
}

function drawHorizontalWall(){
    const rect = new PIXI.Graphics();
    let xTiles = Math.floor(sceneWidth / 50);
    let yTiles = Math.floor(sceneHeight / 50);
    rect.beginFill(0xCCCCCC);
    rect.lineStyle(2,0xCCCCCC,1);
    rect.drawRect(0,0,5,50);
    
    rect.x = (Math.floor((Math.random() * xTiles) + 1) * 50);
    rect.y = (Math.floor((Math.random() * yTiles) + 1) * 50);  

    rect.endFill();
    walls.push(rect);
    gameScene.addChild(rect);
}

function drawVerticalWall(){
    const rect = new PIXI.Graphics();
    let xTiles = Math.floor(sceneWidth / 50);
    let yTiles = Math.floor(sceneHeight / 50);
    rect.beginFill(0xCCCCCC);
    rect.lineStyle(2,0xCCCCCC,1);
    rect.drawRect(0,0,50,5);
    
    rect.x = (Math.floor((Math.random() * xTiles) + 1) * 50);
    rect.y = (Math.floor((Math.random() * yTiles) + 1) * 50);  
    
    rect.endFill(); 
    walls.push(rect);
    gameScene.addChild(rect);
}

function gameLoop(){
	if (paused) return;
	
	// #1 - Calculate "delta time"
	let dt = 1/app.ticker.FPS;
    if(dt > 1/12) dt=1/12;
	
	// #2 - Move Tanks
    //left 37
    if(tank1.isAlive){
        //up 38
        if(keyPressed[38]) {
            move(tank1, speed);
        }
        //down 40
        if(keyPressed[40]) {
            move(tank1, -speed);
        }
        if(keyPressed[37]) {
            tank1.rotation -= rotateSpeed;
        }
        //right 39
        if(keyPressed[39]) {
            tank1.rotation += rotateSpeed;
        }
        //m 77
        if(keyPressed[77]) {
            fireBulletTank1();
        }
    }
    
    if(tank2.isAlive){
        //w 87
        if(keyPressed[87]) {
            move(tank2, speed);
        }
        //s 83
        if(keyPressed[83]) {
            move(tank2, -speed);
        }
        //a 65
        if(keyPressed[65]) {
            tank2.rotation -= rotateSpeed;
        }
        //d 68
        if(keyPressed[68]) {
            tank2.rotation += rotateSpeed;
        }
        //q 81
        if(keyPressed[81]) {
            fireBulletTank2();
        }
    }
    
    tank1.x = clamp(tank1.x, tank1.width/2, sceneWidth - tank1.width/2);
    tank1.y = clamp(tank1.y, tank1.height/2, sceneHeight - tank1.height/2);
    tank2.x = clamp(tank2.x, tank2.width/2, sceneWidth - tank2.width/2);
    tank2.y = clamp(tank2.y, tank2.height/2, sceneHeight - tank2.height/2);
    
	
	// #4 - Move Bullets
    for(let b of bullets){
        b.move(dt);
        if(b.x <= b.radius || b.x >= sceneWidth-b.radius){
            b.reflectX();
        }
        
        if(b.y <= b.radius || b.y >= sceneHeight-b.radius){
            b.reflectY();
        }
    }
	
	// #5 - Check for Collisions
    for(let b of bullets){
        if(circleCollision(tank1,b) && tank1.isAlive){
            fireballSound.play();
            createExplosion(tank1.x, tank1.y, 64, 64);
            gameScene.removeChild(tank1);
            tank1.isAlive = false;
            gameScene.removeChild(b);
            b.isAlive = false;
            increaseScoreBy(1, 2);
        }
        
        if(circleCollision(tank2,b) && tank2.isAlive){
            fireballSound.play();
            createExplosion(tank2.x, tank2.y, 64, 64);
            gameScene.removeChild(tank2);
            tank2.isAlive = false;
            gameScene.removeChild(b);
            b.isAlive = false;
            increaseScoreBy(1, 1);
        }

        if(b.y < -10) b.isAlive = false;
    }
	
	// #6 - Now do some clean up
	bullets = bullets.filter(b=>b.isAlive);
    explosions = explosions.filter(e=>e.playing);
	
	// #7 - Is game over?
	if(!tank1.isAlive || !tank2.isAlive){
        endDelay += dt;
    }
    
    if(endDelay > 2)
        end();
    
    //Increment timers
    tank1FireTimer += dt;
    tank2FireTimer += dt;
}

function end(){
    paused = true;
    
    endDelay = 0;
    
    bullets.forEach(b=>gameScene.removeChild(b));
    bullets = [];
    
    explosions.forEach(e=>gameScene.removeChild(e));
    explosions = [];
    
    gameScene.removeChild(tank1);
    gameScene.removeChild(tank2);
    
    //gameOverScoreLabel.text = `Your final score: ${score}`;
    
    gameOverScene.visible = true;
    gameScene.visible = false;
}

function fireBulletTank1(e){
    if(paused || tank1FireTimer < fireInterval) return;
    
    for(let i = 0; i < numBullets; i++){
        let b = new Bullet(0xFFFFFF, tank1.x,tank1.y, tank1.rotation);
        bullets.push(b);
        gameScene.addChild(b);
    }
    
    shootSound.play();
    
    tank1FireTimer = 0;
}

function fireBulletTank2(e){
    if(paused || tank2FireTimer < fireInterval) return;
    
    for(let i = 0; i < numBullets; i++){
        let b = new Bullet(0xFFFFFF, tank2.x,tank2.y, tank2.rotation);
        bullets.push(b);
        gameScene.addChild(b);
    }
    
    shootSound.play();
    
    tank2FireTimer = 0;
}

function loadSpriteSheet(){
    let spriteSheet = PIXI.BaseTexture.fromImage("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for(let i=0; i<numFrames; i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
        textures.push(frame);
    }
    return textures;
}

function createExplosion(x, y, frameWidth, frameHeight){
    let w2 = frameWidth/2;
    let h2 = frameHeight/2;
    let expl = new PIXI.extras.AnimatedSprite(explosionTextures);
    expl.x = x - w2;
    expl.y = y - h2;
    expl.animationSpeed = 1/7;
    expl.loop = false;
    expl.onComplete = e=>gameScene.removeChild(expl);
    explosions.push(expl);
    gameScene.addChild(expl);
    expl.play();
}