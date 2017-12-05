// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(600,600);
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
PIXI.loader.
add(["images/tank_blue.png","images/explosions.png","images/tank_red.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);

// aliases
let stage;

// game variables
let startScene;
let gameScene,tank1,tank2,scoreLabel,lifeLabel,gameOverScoreLabel,shootSound,hitSound,fireballSound;
let gameOverScene;

//keyboard variables
let keyPressed = [];

let circles = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;
let numBullets = 1;
let rotateSpeed = Math.PI/72;

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
	
	//Create player 1
	tank1 = new Tank();
    tank1.rotation -= Math.PI/2;
    gameScene.addChild(tank1);
    
    //Create player 2
	tank2 = new Tank("tank_blue.png");
    tank2.rotation -= Math.PI/2;
    gameScene.addChild(tank2);
    
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
}

function createLabelsAndButtons(){
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 48,
        fontFamily: 'Verdana'
    });
    
    let startLabel1 = new PIXI.Text("Circle Blast!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 96,
        fontFamily: 'Verdana',
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    startLabel1.x = 50;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);
    
    let startLabel2 = new PIXI.Text("R U worthy..?");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 32,
        fontFamily: 'Verdana',
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    startLabel2.x = 185;
    startLabel2.y = 300;
    startScene.addChild(startLabel2);
    
    let startButton = new PIXI.Text("Enter, ... if you dare!");
    startButton.style = buttonStyle;
    startButton.x = 80;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on("pointerover", e=>e.target.alpha = 0.7);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1);
    startScene.addChild(startButton);
    
    
    // 2 - set up `gameScene`    
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: 'Verdana',
        stroke: 0xFF0000,
        strokeThickness: 4
    });
    
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);
    
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);
    
    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!\n        :-O");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Futura",
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
        fontFamily: 'Verdana',
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
    levelNum = 1;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    tank1.x = 400;
    tank1.y = 550;
    tank2.x = 200;
    tank2.y = 550;
    loadLevel();
}

function increaseScoreBy(value){
    score += value;
    
    if(score >= 5)
        numBullets = 3;
    
    scoreLabel.text = `Score ${score}`;
}

function decreaseLifeBy(value){
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life     ${life}%`;
}

function gameLoop(){
	if (paused) return;
	
	// #1 - Calculate "delta time"
	let dt = 1/app.ticker.FPS;
    if(dt > 1/12) dt=1/12;
	
	// #2 - Move Tanks
    //left 37
    if(keyPressed[37]) {
        tank1.rotation -= rotateSpeed;
    }
    //right 39
    if(keyPressed[39]) {
        tank1.rotation += rotateSpeed;
    }
    //up 38
    if(keyPressed[38]) {
        move(tank1, 1);
    }
    //down 40
    if(keyPressed[40]) {
        move(tank1, -1);
    }
    //ctrl 17
    if(keyPressed[17]) {
        fireBulletTank1();
    }
    //w 87
    if(keyPressed[87]) {
        move(tank2, 1);
    }
    //s 83
    if(keyPressed[83]) {
        move(tank2, -1);
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
	
	// #3 - Move Circles
	for(let c of circles){
        c.move(dt);
        if(c.x <= c.radius || c.x >= sceneWidth-c.radius){
            c.reflectX();
            c.move(dt);
        }
        
        if(c.y <= c.radius || c.y >= sceneHeight-c.radius){
            c.reflectY();
            c.move(dt);
        }
    }
	
	// #4 - Move Bullets
    for(let b of bullets){
        b.move(dt);
    }
	
	// #5 - Check for Collisions
//    for(let b of bullets){
//        if(rectsIntersect(tank1,b)){
//            fireballSound.play();
//            createExplosion(tank1.x, tank1.y, 64, 64);
//            gameScene.removeChild(tank1);
//            tank1.isAlive = false
//            gameScene.removeChild(b);
//            b.isAlive = false
//            increaseScoreBy(1);
//        }
//        
//        if(rectsIntersect(tank2,b)){
//            fireballSound.play();
//            createExplosion(tank2.x, tank2.y, 64, 64);
//            gameScene.removeChild(tank2);
//            tank2.isAlive = false
//            gameScene.removeChild(b);
//            b.isAlive = false
//            increaseScoreBy(1);
//        }
//
//        if(b.y < -10) b.isAlive = false;
//    }
	
	// #6 - Now do some clean up
	bullets = bullets.filter(b=>b.isAlive);
    circles = circles.filter(c=>c.isAlive);
    explosions = explosions.filter(e=>e.playing);
	
	// #7 - Is game over?
	if( life <= 0){
        end();
        return;
    }
	
	// #8 - Load next level
    if(circles.length == 0){
        levelNum++;
        loadLevel();
    }
}

function loadLevel(){
    paused = false;
}

function end(){
    paused = true;
    
    bullets.forEach(b=>gameScene.removeChild(b));
    bullets = [];
    
    explosions.forEach(e=>gameScene.removeChild(e));
    explosions = [];
    
    gameOverScoreLabel.text = `Your final score: ${score}`;
    
    gameOverScene.visible = true;
    gameScene.visible = false;
}

function fireBulletTank1(e){
    if(paused) return;
    
    for(let i = 0; i < numBullets; i++){
        let b = new Bullet(0xFFFFFF, tank1.x + (numBullets*8 - i*8),tank1.y, tank1.rotation);
        bullets.push(b);
        gameScene.addChild(b);
    }
    
    shootSound.play();
}

function fireBulletTank2(e){
    if(paused) return;
    
    for(let i = 0; i < numBullets; i++){
        let b = new Bullet(0xFFFFFF, tank2.x + (numBullets*8 - i*8),tank2.y, tank2.rotation);
        bullets.push(b);
        gameScene.addChild(b);
    }
    
    shootSound.play();
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