var black = 0;
var white = 255;

var dimension;
var weight = 0.005;
var bigRadius = 0.35;
var littleRadius = 0.0905;

var velocity = [];
for(let n = 0; n < 7; n++) {
  velocity.push(0);
}

var notes = [];
var millisecond = 0;
var notePressed = -1;

var midiButton;
var midi = 0;
var midiRadius = 0.35*littleRadius;

var midiInput, midiOutput;

var noteOnStatus     = 144;
var noteOffStatus    = 128;
var aftertouchStatus = 160;

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

function ndtToDeg(n) {
  switch(n){
    case 0: return 1;
    case 2: return 2;
    case 4: return 3;
    case 5: return 4;
    case 7: return 5;
    case 9: return 6;
    case 11:return 7;
    default: return false;
  }
}

class Note {
  constructor(degree) {
    this.d = degree;
    this.n = degToNdt(degree);

    this.angle = PI/2 - this.n*PI/6;

    this.velocity = 0;

    this.button = new Clickable();
    this.button.color = white;
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
    let alt = this.n-degToNdt(this.d);
    while(alt < -6) {alt += 12;}
    while(alt >  6) {alt -= 12;}
    switch(alt) {
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
    let vel = this.velocity;
    let r = (littleRadius-vel*weight/2)*dimension;
    this.button.resize(2*r,2*r);
    this.button.locate(width/2 +bigRadius*dimension*cos(this.angle)-r,
                       height/2-bigRadius*dimension*sin(this.angle)-r);
    this.button.strokeWeight = (1+vel)*weight*dimension;
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
    textSize(0.08*dimension);
    textFont(font);
    text(this.text,this.button.x+this.button.width/2,
                   this.button.y+this.button.height/2-0.01*dimension);
  }

  draw() {
    this.button.draw();
    this.drawText();
  }
}

function initMidiButton() {
  midiButton = new Clickable();
  midiButton.color = white;
  midiButton.cornerRadius = 1000;
  midiButton.stroke = black;
  midiButton.text = '';
  midiButton.onPress = function() {
    //if(this.color == white) {
      enableMidi();
    /*}
    else {
      disableMidi();
    }*/
  }
  updateMidiButton();
}

function updateMidiButton() {
  let r = midiRadius*dimension;
  midiButton.resize(2*r,2*r);
  midiButton.locate(width/2 -r,
                     height/2-r);
  midiButton.strokeWeight = weight*dimension;
}

function drawMidiButton() {
  midiButton.draw();

  noStroke();
  fill(midiButton.color==white?black:white);
  let r  = 0.14*midiRadius*dimension;
  let br = 0.6*midiRadius*dimension;
  for(let n = 0; n < 5; n++) {
    let a = n*PI/4;
    circle(width/2+br*cos(a),height/2-br*sin(a),2*r,2*r);
  }
  let l = 0.7*midiRadius*dimension;
  let h = 0.35*midiRadius*dimension;
  rect(width/2-l/2,height/2+1.1*br,l,h,h);
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

  initMidiButton();
}

function draw() {
  background(white);

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
    var note = notes[n];
    if(velocity[n] || note.velocity) {
      note.velocity = lerp(note.velocity,6.5*velocity[n],0.75);
      note.update();
    }
    if(n != notePressed) {
      note.draw();
    }
  }

  if(notePressed > -1) {
    notes[notePressed].move();
  }

  if(midi == 0) {
    drawMidiButton();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let n = 0; n < notes.length; n++) {
    notes[n].update();
  }

  updateMidiButton();
}

//------------------------------------------------------------------------------
//                             MIDI
//------------------------------------------------------------------------------

function enableMidi() {
  WebMidi.enable(function (err) {
    if (err) console.log("An error occurred", err);

    //---------------------INPUT--------------------

    var liste = '';
    var taille = WebMidi.inputs.length;
    var i, num;
    var numStr = '0';

    if(taille == 0) {
      window.alert("No MIDI input device detected.");
      disableMidi();
      return;
    }

    for(let i = 0; i < taille; i++) {
      num = i+1;
      liste += '   ' + num.toString() + '   -   ' + WebMidi.inputs[i].name + '\n';
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 3) {
      numStr = window.prompt("Write the number of the desired MIDI input device:\n\n"+liste);
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      window.alert("No MIDI input selected. MIDI disabled.");
      disableMidi();
      return;
    }
    else {
      midiInput = WebMidi.inputs[num-1];
      window.alert('Input selected: ' + midiInput.name);
      if(!midiInput.hasListener('noteon', 'all', handleNoteOn)) {
        midiInput.addListener('noteon', 'all', handleNoteOn);
        midiInput.addListener('noteoff', 'all', handleNoteOff);
      }
      if(!midiInput.hasListener('keyaftertouch', 'all', handleAftertouch)) {
        midiInput.addListener('keyaftertouch', 'all', handleAftertouch);
        midiInput.addListener('keyaftertouch', 'all', handleAftertouch);
      }
      midi = 1;
      //midiButton.color  = black;
      //midiButton.stroke = white;
    }

    //--------------------OUTPUT--------------------

    liste = '';
    taille = WebMidi.outputs.length;
    numStr = '0';

    if(taille == 0) {
      window.alert("No MIDI output device detected.");
      return;
    }

    for(let i = 0; i < taille; i++) {
      num = i+1;
      liste += '   ' + num.toString() + '   -   ' + WebMidi.outputs[i].name + '\n';
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 3) {
      numStr = window.prompt("Write the number of the desired MIDI output device:\n\n"+liste);
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      window.alert("No MIDI output selected. Input still works.");
      return;
    }
    else {
      midiOutput = WebMidi.outputs[num-1];
      window.alert('Output selected: ' + midiOutput.name);
      midi = 2;
    }
  },true);
}

function handleNoteOn(e) {
  var deg = ndtToDeg(e.note.number%12);
  if(deg) {
    if(midi == 2) {
      midiOutput.send(e.data[0],[e.note.octave*12+notes[deg-1].n,e.data[2]]);
    }
    velocity[deg-1] = e.velocity;
  }
}

function handleAftertouch(e) {
  var deg = ndtToDeg(e.note.number%12);
  if(deg) {
    if(midi == 2) {
      midiOutput.send(e.data[0],[e.note.octave*12+notes[deg-1].n,e.data[2]]);
    }
    velocity[deg-1] = e.value;
  }
}

function handleNoteOff(e) {
  var deg = ndtToDeg(e.note.number%12);
  if(deg) {
    if(midi == 2) {
      midiOutput.send(e.data[0],[e.note.octave*12+notes[deg-1].n,e.data[2]]);
    }
    velocity[deg-1] = 0;
  }
}

function disableMidi() {
  midi = 0;

  for(let i = 0; i < WebMidi.inputs.length; i++) {
    WebMidi.inputs[i].removeListener();
  }

  WebMidi.disable();

  //midiButton.color  = white;
  //midiButton.stroke = black;
}
