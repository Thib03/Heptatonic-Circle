var black = 0;
var white = 255;
var note;
var millisecond = 0;
var buttonPressed = -1;

class Note {
  constructor(t,/*i,*/x,y,l,h) {
    this.button = new Clickable(width /2+x-l/2,
                                height/2+y-h/2);
    this.button.resize(l,h);
    this.button.color = 255;
    this.button.cornerRadius = dimension();
    this.button.strokeWeight = 0.0034*dimension();
    this.button.stroke = black;
    this.button.text = '';

    this.t = t;
    this.tc = black;

    this.button.onPress = function() {
      if(millis()-millisecond > 500) {
        if(buttonPressed == -1) {
          buttonPressed = 0;
        }
        millisecond = millis();
      }

      this.locate(mouseX-l/2,mouseY-h/2);
    }

    /*this.button.onHover = function() {
      cursor(HAND);
    }*/

    this.button.onRelease = function() {
      buttonPressed = -1;
    }

    /*this.button.onOutside = function() {
      cursor(ARROW);
    }*/
  }

  drawText() {
    fill(this.tc);
    textAlign(CENTER,CENTER);
    textSize(0.4*pow(pow(this.button.width,2)*this.button.height,1/3));
    //textFont(font);
    text(this.t,this.button.x+this.button.width/2,
                this.button.y+this.button.height/2+0.003*dimension());
  }

  draw() {
    this.button.draw();
    this.drawText();
    //image(this.i,0,0,50,200);
  }

  toggle(bool) {
    if(bool) {
      this.button.color = black;
      this.tc = white;
    }
    else {
      this.button.color = white;
      this.tc = black;
    }
  }
}

function dimension() {
  return sqrt(width*height);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  note = new Note('X',0,0,0.1*dimension(),0.1*dimension());
}

function draw() {
  background(255);

  noFill();
  stroke(black);
  strokeWeight(0.0034*dimension());
  circle(width/2,height/2,0.75*dimension(),0.75*dimension());

  note.draw();

  if(buttonPressed > -1) {
    note.button.locate(mouseX-note.button.width/2,
                       mouseY-note.button.height/2);
  }
}
