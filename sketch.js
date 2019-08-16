var black = 0;
var white = 255;
var note;
var millisecond = 0;

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
    //this.i = i;
    this.x = x;
    this.y = y;
    this.l = l;
    this.h = h;

    this.button.onOutside = function() {
      cursor(ARROW);
    }

    this.button.onHover = function(){
      cursor(HAND);
    }

    /*this.button.onRelease = function(){
      this.color = 255;
    }*/
  }

  drawText() {
    fill(this.tc);
    textAlign(CENTER,CENTER);
    textSize(0.4*pow(pow(this.l,2)*this.h,1/3));
    //textFont(font);
    text(this.t,width/2+this.x,
         height/2+this.y+0.003*dimension());
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

  note = new Note('B',0,0,0.1*dimension(),0.1*dimension());
  note.button.onPress = function() {
    if(millis()-millisecond > 200) {
      if(note.button.color == 255) {
        note.toggle(true);
      }
      else {
        note.toggle(false);
      }
      millisecond = millis();
    }
  }
}

function draw() {
  background(255);

  noFill();
  stroke(black);
  strokeWeight(0.0034*dimension());
  circle(width/2,height/2,0.75*dimension(),0.75*dimension());

  note.draw();
}
