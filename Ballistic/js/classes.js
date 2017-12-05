class Tank extends PIXI.Sprite{
    constructor(file="tank_red.png"){
        super(PIXI.loader.resources["images/" + file].texture);
        this.anchor.set(.5,.5);
        this.scale.set(1);
    }
}

//class Circle extends PIXI.Graphics{
//    constructor(radius, color=0xFF0000, x=0, y=0){
//        super();
//        this.beginFill(color);
//        this.drawCircle(0,0,radius);
//        this.endFill();
//        this.x = x;
//        this.y = y;
//        this.radius = radius;
//        
//        this.fwd = getRandomUnitVector();
//        this.speed = 50;
//        this.isAlive = true;
//    }
//    
//    move(dt=1/60){
//        this.x += this.fwd.x * this.speed * dt;
//        this.y += this.fwd.y * this.speed * dt;
//    }
//    
//    reflectX(){
//        this.fwd.x *= -1;
//    }
//    
//    reflectY(){
//        this.fwd.y *= -1;
//    }
//}

class Bullet extends PIXI.Graphics{
    constructor(color=0xFF0000, x=0, y=0, rotation=0){
        super();
        this.beginFill(color);
        this.drawRect(-2,-3,4,6);
        this.endFill();
        
        this.fwd = {x:Math.cos(rotation),y:Math.sin(rotation)};
        this.x = x;
        this.y = y;
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);
    }
    
    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}