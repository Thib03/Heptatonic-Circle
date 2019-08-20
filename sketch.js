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

var number = [];
for(let n = 0; n < 75; n++) {
  number.push(0);
}

var notesOn = [];
for(let n = 0; n < 7; n++) {
  notesOn.push([]);
}

var notes = [];
var millisecond = 0;
var notePressed = -1;

var midiButton;
var midi = 0;
var midiRadius = 0.35*littleRadius;

var midiInput, midiOutput;

/*var noteOnStatus     = 144;
var noteOffStatus    = 128;
var aftertouchStatus = 160;*/

var synth;

var fonDeg = 0;
//var fonNum = 130;

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

function degToColor(d) {
  switch(d) {
    case 1:  return [109,158,235];
    case 3:  return [146,196,125];
    case 5:  return [224,102,101];
    case 7:  return [254,217,102];
    default: return [217,217,217];
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
            else if(note.d == fonDeg) {
              let i = note.d-1;
              for(let d = 1; d <= 7; d++) {
                notes[i].setColor(0);
                i++;
                i %= 7;
              }
            }
            else {
              let i = note.d-1;
              for(let d = 1; d <= 7; d++) {
                notes[i].setColor(d);
                i++;
                i %= 7;
              }
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

  alt() {
    let a = this.n-degToNdt(this.d);
    while(a < -6) {alt += 12;}
    while(a >  6) {alt -= 12;}
    return a;
  }

  midiNumber(octave) {
    var oct = octave;
    if     (this.d < 4 && this.n > 8) {
      oct--;
    }
    else if(this.d > 4 && this.n < 3) {
      oct++;
    }
    var n = oct*12+this.n;
    if(n < 0) {n = 0};
    return n;
  }

  setColor(d) {
    if(!d) {
      this.button.color = white;
      return;
    }
    this.button.color = degToColor(d);
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
    switch(this.alt()) {
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

class PolySynth {
  constructor(num) {
    this.voices = [];
    for(let v = 0; v < num; v++) {
      var env = new p5.Envelope();
      var osc = new p5.Oscillator();
      osc.setType('sine');
      osc.amp(env);
      osc.start();
      this.voices.push([-1,osc,env]);
    }
  }

  noteAttack(pit,vel) {
    var frq = 16.3515*exp(pit*log(2)/12);
    var v;
    for(v = 0; v < this.voices.length; v++) {
      var voice = this.voices[v];
      if(voice[0] == -1) {
        voice[0] = pit;
        voice[1].freq(frq);
        voice[2].setRange(vel,0);
        voice[2].setADSR(0.001,0.1,0.5,0.3);
        voice[2].triggerAttack();
        break;
      }
    }
    if(v == this.voices.length) {
      console.log('Maximum number of voices reached.');
    }
  }

  noteAftertouch(pit,vel) {
    for(let v = 0; v < this.voices.length; v++) {
      var voice = this.voices[v];
      if(voice[0] == pit) {
        //voice[1].amp(vel);
        break;
      }
    }
  }

  noteRelease(pit) {
    for(let v = 0; v < this.voices.length; v++) {
      var voice = this.voices[v];
      if(voice[0] == pit) {
        voice[0] = -1;
        voice[2].triggerRelease();
        break;
      }
    }
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

  synth = new PolySynth(6);
  /*synth = new p5.PolySynth();
  synth.setADSR(0.001,0.1,0.5,0.3);*/
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

  /*if(fonDeg) {
    var n = fonDeg-1;
    for(let d = 1; d <= 7; d++) {
      notes[n].setColor(d);
      n++;
      n %= 7;
    }
  }*/

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
    var oct = e.note.octave+1;
    var vel = e.velocity;
    var num = notes[deg-1].midiNumber(oct);
    number[7*oct+deg-1] = num;
    if(midi == 2) {
      midiOutput.send(e.data[0],[num,e.data[2]]);
    }
    else {
      synth.noteAttack(num,vel);
    }
    notesOn[deg-1].push([num,vel]);
    var l = notesOn[deg-1].length;
    if(l > 1) {
      var max = 0;
      var v;
      for(let i = 0; i < l; i++) {
        v = notesOn[deg-1][i][1];
        if(v > max) {
          max = v;
        }
      }
      velocity[deg-1] = max;
    }
    else {
      velocity[deg-1] = vel;
    }
    /*if(!fonDeg || num < fonNum) {
      fonDeg = deg;
      fonNum = num;
    }*/
  }
}

function handleAftertouch(e) {
  var deg = ndtToDeg(e.note.number%12);
  if(deg) {
    var oct = e.note.octave+1;
    var vel = e.value;
    var num = number[7*oct+deg-1];
    if(midi == 2) {
      midiOutput.send(e.data[0],[num,e.data[2]]);
    }
    else {
      synth.noteAftertouch(num,vel);
    }
    var l = notesOn[deg-1].length;
    for(let i = 0; i < l; i++) {
      if(notesOn[deg-1][i][0] == num) {
        notesOn[deg-1][i][1] = vel;
        break;
      }
    }
    if(l > 1) {
      var max = 0;
      var v;
      for(let i = 0; i < l; i++) {
        v = notesOn[deg-1][i][1];
        if(v > max) {
          max = v;
        }
      }
      velocity[deg-1] = max;
    }
    else {
      velocity[deg-1] = vel;
    }
  }
}

function handleNoteOff(e) {
  var deg = ndtToDeg(e.note.number%12);
  var oct = e.note.octave+1;
  if(deg) {
    var num = number[7*oct+deg-1];
    if(midi == 2) {
      midiOutput.send(e.data[0],[num,e.data[2]]);
    }
    else {
      synth.noteRelease(num);
    }
    var l = notesOn[deg-1].length;
    for(let i = 0; i < l; i++) {
      if(notesOn[deg-1][i][0] == num) {
        notesOn[deg-1].splice(i,1);
        l--;
        break;
      }
    }
    if(l >= 1) {
      var max = 0;
      var v;
      for(let i = 0; i < l; i++) {
        v = notesOn[deg-1][i][1];
        if(v > max) {
          max = v;
        }
      }
      velocity[deg-1] = max;
    }
    else {
      velocity[deg-1] = 0;
    }
    /*if(fonDeg && fonNum == num) {
      var minDeg = 0;
      var minNum = 130;
      for(let i = 0; i < 7; i++) {
        for(let j = 0; j < notesOn[i].length; j++) {
          if(notesOn[i][j][0] < minNum) {
            minDeg = i+1;
            minNum = notesOn[i][j][0];
          }
        }
      }
      fonDeg = minDeg;
      fonNum = minNum;
      if(!minDeg) {
        for(let i = 0; i < 7; i++) {
          notes[i].setColor(0);
        }
      }
    }*/
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
