var black = 0;
var white = 255;

var dimension;
var weight = 0.005;
var bigRadius = 0.35;
var littleRadius = 0.0905;

var angle;

var notes = [];
var millisecond = 0;
var notePressed = -1;

function degToNdt(d) {
  switch(d) {
    default:
    case 1: return 0;
    case 2: return 2;
    case 3:	return 4;
    case 4: return 5;
    case 5: return 7;
    case 6: return 9;
		case 7: return 11;
  }
}

class Note {
  constructor(degree) {
    this.d = degree;
    this.n = degToNdt(degree);

    this.angle = PI/2 - this.n*PI/6;

    this.button = new Clickable();
    this.button.color = 255;
    this.button.cornerRadius = 1000;
    this.button.stroke = black;
    this.button.text = '';

    this.updateText();
    this.textColor = black;

    var deg = this.d;

    this.button.onPress = function() {
      notePressed = deg-1;
    }

    this.button.onRelease = function() {
      if(notePressed > -1) {
        var note = notes[notePressed];
        notePressed = -1;
        var x = mouseX-width/2;
        var y = -(mouseY-height/2);
        var a = Math.atan(y/x);
        if(x < 0) {
          a += PI;
        }
        var min = (notes[(note.d+5)%7].n+1)%12;
        var max =  notes[(note.d  )%7].n;
        for(let n = min; n != max; n = (n+1)%12) {
          var da = PI/2 - n*PI/6 - a;
          while(da < 0)     {da += 2*PI;}
          while(da >= 2*PI) {da -= 2*PI;}
          if(da >= 2*PI - PI/12 || da < PI/12) {
            if(n != note.n) {
              note.n = n;
            }
          }
        }
        note.angle = PI/2 - note.n*PI/6;
        note.updateText();
        note.update();
      }
    }

    this.update();
  }

  updateText() {
    var text = '';
    switch(this.d) {
      default:
      case 1: text += 'C'; break;
      case 2: text += 'D'; break;
      case 3: text += 'E'; break;
      case 4: text += 'F'; break;
      case 5: text += 'G'; break;
      case 6: text += 'A'; break;
      case 7: text += 'B'; break;
    }
    switch(this.n-degToNdt(this.d)) {
      case -2: text += 'bb'; break;
      case -1: text += 'b';  break;
      case  0:               break;
      case  1: text += '#';  break;
      case  2: text += '##'; break;
      default: text += '?';
    }
    this.text = text;
  }

  update() {
    this.button.resize(2*littleRadius*dimension,2*littleRadius*dimension);
    this.button.locate(width/2 +bigRadius*dimension*cos(this.angle)-littleRadius*dimension,
                       height/2-bigRadius*dimension*sin(this.angle)-littleRadius*dimension);
    this.button.strokeWeight = weight*dimension;
  }

  move() {
    var x = mouseX-width/2;
    var y = -(mouseY-height/2);
    let r = sqrt(pow(x,2)+pow(y,2));
    if(r >= (bigRadius-littleRadius)*dimension &&
       r <  (bigRadius+littleRadius)*dimension) {
      var a = Math.atan(y/x);
      if(x < 0) {
        a += PI;
      }
      this.angle = a;//lerp(this.angle,a,0.8);
    }
    else {
      this.angle = PI/2 - this.n*PI/6;
      notePressed = -1;
    }
    this.update();
    this.draw();
  }

  drawText() {
    fill(this.textColor);
    textAlign(CENTER,CENTER);
    textSize(0.475*pow(pow(this.button.width,2)*this.button.height,1/3));
    textFont(font);
    text(this.text,this.button.x+this.button.width/2,
                   this.button.y+this.button.height/2-0.009*dimension);
  }

  draw() {
    this.button.draw();
    this.drawText();
  }
}

function preload() {
  font = loadFont('nunito.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let d = 1; d <= 7; d++) {
    notes.push(new Note(d));
  }
}

function draw() {
  background(255);

  noFill();
  stroke(black);
  strokeWeight(weight*dimension);
  circle(width/2,height/2,2*bigRadius*dimension,2*bigRadius*dimension);

  for(let n = 0; n < 12; n++) {
    let a = PI/2 - n*PI/6;
    let r = bigRadius*dimension;
    let dr = 0.65*littleRadius*dimension;
    line(width/2+(r+dr)*cos(a),height/2-(r+dr)*sin(a),
         width/2+(r-dr)*cos(a),height/2-(r-dr)*sin(a));
  }

  for(let n = 0; n < notes.length; n++) {
    if(n != notePressed) {
      notes[n].draw();
    }
  }

  if(notePressed > -1) {
    notes[notePressed].move();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let n = 0; n < notes.length; n++) {
    notes[n].update();
  }
}
