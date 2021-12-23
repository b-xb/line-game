game = {
  height:550,
  width:800,
  background:"black",
  timestamp:0,
  prev_timestamp:0
};

var mySound;

COLOUR1 = "Cyan";
COLOUR2 = "Yellow";
COLOUR3 = "GreenYellow";
COLOUR4 = "Magenta";

bpm = 120;
bar_length = 4;
bar_delay=8;
bar_preload=4;
division = 2;
var level_data;

function preload() {
  createCanvas(game.width, game.height);
  level_path = "level.json";
  level_data = loadJSON(level_path,loadMusic,loadingError,loadingLevelProgress);
  function loadMusic() {
    mySound = loadSound("line_theme.mp3",null,loadingError,loadingMusicProgress);
  }
}



function loadingLevelProgress(p){
  background("black");
  fill(255);
  textAlign(CENTER);
  text("Loading Level: "+p, width/2, height/2);
}

function loadingMusicProgress(p){
  background("black");
  fill(255);
  textAlign(CENTER);
  text("Loading Music: "+p, width/2, height/2);
}

function loadingError(){
  background("black");
  text("Loading Error: ", width/2, height/2);
}

function beatTimestamp(i) { 
  return (i*60.0)/(bpm*division);
}

function timestampToBeat(t) { 
  return (t*bpm*division)/60.0;
}

autopilot = {
  force:6000,
  target:50,
  t_o: 0,
  y_o: 50,
  v_o: 0,
  a_o: 0,
  t_tp: 0,
  y_tp: 50,
  v_tp: 0,
  a_tp: 0,
  t_p: 0,
  y_p: 50,
  v_p: 0,
  a_p: 0,
  t_f: 0,
  y_f: 50,
  v_f: 0,
  a_f: 0,
  d: 0,
  d_dir: 0,
}

ship = {
  target: 50,
  x: 50,
  y: 50,
	h: 20,
	l: 20,
	c: "white",
	sc: "black",
	sw: 4,
	v: 0,
	laser: {
	  active: 0,
	  cooldown: 0,
	  y: 50,
	  sw: function() { return this.active > 4 ? 8 - this.active : this.active; },
	  sc: 255,
	  draw: function() {
	    strokeWeight(this.sw());
      stroke(this.sc);
      line(ship.x + (ship.l/2),this.y,800,this.y);
	  }
	},
  draw: function() {
    fill(this.c);
    strokeWeight(this.sw);
    stroke(this.sc);
    beginShape();
    vertex(this.x, this.y);
    vertex(this.x, this.y - (this.h/2));
    vertex(this.x + this.l, this.y);
    vertex(this.x, this.y + (this.h/2));
    endShape(CLOSE);
	}
}

columns = [];
column = [];
liveSprites = new Set();

function drawSprite(sprite) {
  switch(sprite.type) {
    case "coin":
    case "boulder":
      fill(sprite.c);
      strokeWeight(sprite.sw);
      stroke(sprite.sc);
      ellipse(sprite.x, sprite.y, sprite.r*2, sprite.r*2);
      break;
  }
}

function spriteConstruct(height,levelPosition,type)
{
  this.alive = 1;
  this.lx = levelPosition;
  this.x = 600;
  this.y = (50 * height) + 50; 
  this.r = 10;
  this.c = "white";
  this.sc = "black";
  this.sw = 4;
  this.vx = -8;
  this.vy = 0;
  this.type = type;
  this.draw = function() { drawSprite(this) };
}

function initSprites() {
	for (var i = 0; i < 10; i++) {
		column[i] = new spriteConstruct(i,"boulder");
	}
}

function loadSprites(col) {
  for (var h = 0; h < 10; h++) {
    switch (col.string.charAt(h)) {
      case '*': 
        liveSprites.add(new spriteConstruct(h,col.levelPosition,"coin"));
      case 'X': 
        liveSprites.add(new spriteConstruct(h,col.levelPosition,"boulder"));
      default:
    }
	}
}

function resetSprites() {
	var randomnumber = Math.floor(Math.random()*10);
	for (var i = 0; i < 10; i++) {
		if (i == randomnumber) 
		{
			column[i].alive = 0;
		} else {
			column[i].x = 600;
			column[i].alive = 1;
		}
	}	
}

function setup() {
  createCanvas(game.width, game.height);
  startGame();
}

function startGame() {

  bpm = level_data.bpm;
  division = level_data.beat_division;
  bar_length = level_data.bar_length;
  bar_delay = level_data.bar_delay;
  bar_preload = level_data.bar_preload;
  
  level_data.columns.forEach(function(string, beat) {
    mySound.addCue( beatTimestamp(beat+((bar_delay-bar_preload)*bar_length*division)), loadSprites, { string: string, levelPosition: beat+(bar_delay*bar_length*division) } );
  })
  
  for (let i = 0; i < 1200; i+=(bar_length*division)) {
    mySound.addCue(beatTimestamp(i+0), setBackground, COLOUR1 );
    mySound.addCue(beatTimestamp(i+(1*division)), setBackground, COLOUR2 );
    mySound.addCue(beatTimestamp(i+(2*division)), setBackground, COLOUR3 );
    mySound.addCue(beatTimestamp(i+(3*division)), setBackground, COLOUR4 );
  }
  
  // Loops level back to the start
  mySound.addCue( beatTimestamp((58*8)+0.499), function(){ mySound.jump(beatTimestamp(16.499)) });

}

function setBackground(val) {
  if (mySound.isPlaying()) {
    //console.log(mySound.currentTime()+ " " + timestampToBeat(mySound.currentTime()));
  }
  game.background=val;
  
  //console.log(ship.laser.active);
	if (ship.laser.active > 0) {
	  ship.laser.active -= 1;
	}
	//console.log(ship.laser.cooldown);
	if (ship.laser.cooldown > 0) {
	  ship.laser.cooldown -= 1;
	}
}

function changeText(obj) {
  background(obj.fill);
  text(obj.txt, width/2, height/2);
}

function mouseClicked() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (mySound.isPlaying() ) {
      mySound.stop();
      liveSprites.clear();
      game.timestamp = 0;
      game.prev_timestamp = 0;
      ship.v = 0;
      ship.y = 50;
    } else {
      mySound.playMode("sustain");
      mySound.play();
      setBackground(COLOUR1);
    }
  }
}

function keyPressed(){
  //console.log(key);
  switch(key) {
    case " ":
      if (ship.laser.cooldown <= 0) {
        ship.laser.y = ship.y;
        ship.laser.active=6;
        ship.laser.cooldown=6;
      }
      break;
    case "A":
    case "a":
      ship.target = 500;
      break;
    case "S":
    case "s":
      ship.target = 450;
      break;
    case "D":
    case "d":
      ship.target = 400;
      break;
    case "F":
    case "f":
      ship.target = 350;
      break;
    case "G":
    case "g":
      ship.target = 300;
      break;
    case "H":
    case "h":
      ship.target = 250;
      break;
    case "J":
    case "j":
      ship.target = 200;
      break;
    case "K":
    case "k":
      ship.target = 150;
      break;
    case "L":
    case "l":
      ship.target = 100;
      break;
    case ";":
      ship.target = 50;
      break;
    default:
  }
}


function draw() {
  background(game.background);
  if (mySound) {
    game.prev_timestamp = game.timestamp;
    game.timestamp = mySound.currentTime();
  
    if (mySound.isPlaying()) {
    
      strokeWeight(4);
      stroke(0);
      line(ship.x + (ship.l/2),0,ship.x + (ship.l/2),550);

      // Ship moving algorithm
      // Works out algorithm for the ships movement to it's target location set by key input

      ap = autopilot;
   
      if (ap.target != ship.target) {
  
        // setup
        
        ap.target = ship.target;
        ap.y_o = ship.y;
    
        ap.v_o = ship.v;
        ap.t_o = game.prev_timestamp;
        ap.y_f = ap.target;
        ap.v_f = 0;
        ap.d = ap.y_f - ap.y_o;  // displacement
        ap.d_dir = Math.sign(ap.d);
  
        // Work out ship curve type

        if (Math.sign(ap.v_o)*ap.d_dir < 0) {  // will skid, travelling in wrong direction
        
          ap.a_o = ap.force * ap.d_dir;
          ap.v_tp = 0;
          ap.t_tp = ((ap.v_tp-ap.v_o)/ap.a_o) + ap.t_o;
          ap.y_tp = -Math.pow(ap.v_o,2)/(2*ap.a_o) + ap.y_o;
          ap.a_tp = ap.force * ap.d_dir;

        } else if ( Math.pow(ap.v_o,2) > (2 * ap.force * ap.d * ap.d_dir) ) { // will overshoot
        
          ap.a_o = -ap.force * ap.d_dir;
          ap.v_tp = 0;
          ap.t_tp = ((ap.v_tp-ap.v_o)/ap.a_o) + ap.t_o;
          ap.y_tp = -Math.pow(ap.v_o,2)/(2*ap.a_o) + ap.y_o;
          ap.a_tp = -ap.force * ap.d_dir;

        } else {  // no turning point
        
          ap.a_o = ap.force * ap.d_dir;
          ap.v_tp = ap.v_o;
          ap.t_tp = ap.t_o;
          ap.y_tp = ap.y_o;
          ap.a_tp = ap.a_o;
        }

        // Calculate peak velocity point
        
        ap.y_p = (-Math.pow(ap.v_tp,2)/(4*ap.a_tp)) + (0.5*(ap.y_tp+ap.y_f));
        //console.log(ap.y_p);
        ap.v_p = Math.sign(ap.a_tp)*Math.sqrt( (0.5*Math.pow(ap.v_tp,2)) + (ap.a_tp * (ap.y_f-ap.y_tp) ) );
        ap.t_p = ((ap.v_p - ap.v_tp)/ap.a_tp) + ap.t_tp;
        ap.a_p = -ap.a_tp;
  
        // Calculate arrival time
        
        ap.t_f = -(ap.v_p/ap.a_p) + ap.t_p;
        ap.a_f = 0;
      }
  
      // Calculate current position and velocity for ship
      
      if (game.timestamp >= ap.t_f) {
        ship.v = 0;
        ship.y = ap.target;
      } else if (game.timestamp >= ap.t_p) {
        t = game.timestamp-ap.t_p;
        ship.v = ap.v_p + (ap.a_p * t);
        ship.y = 0.5*(ship.v+ap.v_p)*t + ap.y_p;
      } else if (game.timestamp >= ap.t_tp) {
        t = game.timestamp-ap.t_tp;
        ship.v = ap.v_tp + (ap.a_tp * t);
        ship.y = 0.5*(ship.v+ap.v_tp)*t + ap.y_tp
      } else if (game.timestamp >= ap.t_o) {
        t = game.timestamp-ap.t_o;
        ship.v = ap.v_o + (ap.a_o * t);
        ship.y = 0.5*(ship.v+ap.v_o)*t + ap.y_o;
      }
      
      // Draw ship's laser
  
      if (ship.laser.active > 0) {
        ship.laser.draw();
      }
      
      // Draw ship
  
      ship.draw();
      
      // Draw boulder sprites
  
      for (let sprite of liveSprites) {
        if (sprite.alive == 1) {
          if (sprite.x < 0-sprite.r-sprite.sw) {
            liveSprites.delete(sprite);
          } else {
            ship_position = ship.x + (ship.l/2)
            speed = 100;
            sprite.x = ship_position + (beatTimestamp(sprite.lx)*speed) - (game.timestamp*speed);
            sprite.draw();
          }
        }
      }
	
	  } else {
      strokeWeight(4);
      stroke(0);
      fill(255);
      textAlign(CENTER);
      text('CONTROLS\n\nmove: a s d f g h j k l ;\nshoot: space\n\nclick the screen to start/stop the game', width/2, height/2);
    }
	
	}
}
