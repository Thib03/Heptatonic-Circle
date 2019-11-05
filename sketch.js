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

var midiHandler;
var midi = 0;
var midiRadius = 0.35*littleRadius;

var midiInput, midiOutput;

var hasSequencer = false;
var sequencerOutput;

var launchpad;

var noteOnStatus     = 144;
var noteOffStatus    = 128;
var aftertouchStatus = 160;

var synth;

var font, fontLight;

var tritons = [];

for(let i = 0; i < 6; i++) {
  tritons[i] = false;
}

let t1 = 0.001;
let l1 = 1; // velocity
let t2 = 0.1;
let l2 = 0.5; // aftertouch
let t3 = 0.3;
let l3 = 0;

var fonDeg = 0;
//var fonNum = 130;
var nextNote = false;

var dragX, dragY, dragDist;
var dragLimit = 0.1;

var midiScale = [[]];

var maxFreq = 10000;

function deg(d) {
  while(d < 1) {d += 7;}
  return (d-1)%7+1;
}

function ndt(n) {
  while(n < 0) {n += 12;}
  return n%12;
}

function alt(a) {
  while(a < -6) {a += 12;}
  while(a >  6) {a -= 12;}
  return a;
}

function degToNdt(d) {
  switch(deg(d)) {
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
  switch(ndt(n)){
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

function degToColor(d,light=false) {
  if(light) {
    switch(deg(d)) {
      case 1:  return 41;
      case 3:  return 25;
      case 5:  return 60;
      case 7:  return 13;
      default: return 0;//70;
    }
  }
  switch(deg(d)) {
    case 1:  return [109,158,235];
    case 3:  return [146,196,125];
    case 5:  return [224,102,101];
    case 7:  return [254,217,102];
    default: return [217,217,217];
  }
}

function triggerColors(deg,overwrite = false) {
  var updateColumn = false;
  if(launchpad.isOn && ((fonDeg == deg && !overwrite) || !fonDeg)) {
    updateColumn = true;
  }
  if(fonDeg == deg) {
    if(overwrite) {
      return;
    }
    fonDeg = 0;
    for(let d = 1; d <= 7; d++) {
      notes[d-1].setColor(0);
      notes[d-1].updateText();
    }
  }
  else {
    fonDeg = deg;
    let i = fonDeg-1;
    for(let d = 1; d <= 7; d++) {
      notes[i].setColor(d);
      notes[i].updateText();
      i++;
      i %= 7;
    }
  }
  if(launchpad.isOn) {
    launchpad.update();
    if(updateColumn) {
      launchpad.sendControlColumn();
    }
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
      dragDist = 0;
      dragX = mouseX;
      dragY = mouseY;
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
              if(note.d == fonDeg) {
                for(let d = 2; d <= 7; d++) {
                  notes[(fonDeg+d+5)%7].updateText();
                }
              }
            }
            else if(dragDist < dragLimit*dimension) {
              triggerColors(note.d);
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
    return alt(this.n-degToNdt(this.d));
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
    if(!fonDeg) {
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
      var a = this.alt();
      switch(a) {
        case -3: text += 'bbb';break;
        case -2: text += 'bb'; break;
        case -1: text += 'b';  break;
        case  0:               break;
        case  1: text += '#';  break;
        case  2: text += '##'; break;
        case  3: text += '###';break;
        default: text += Math.abs(a) + (a>0?'#':'b'); break;
      }
    }
    else {
      var a = alt(ndt(this.n-notes[fonDeg-1].n)-degToNdt(this.d-notes[fonDeg-1].d+1));
      switch(a) {
        case -3: text += '---';break;
        case -2: text += '--'; break;
        case -1: text += '-';  break;
        case  0:               break;
        case  1: text += '+';  break;
        case  2: text += '++'; break;
        case  3: text += '+++';break;
        default: text += Math.abs(a) + (a>0?'+':'-');  break;
      }
    }
    this.text = text;
  }

  update() {
    let vel = 6.5*(-pow(0.5*this.velocity/6.5-1,4)+1);
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
    var adjustY;
    if(fonDeg) {
      textSize(0.1*dimension);
      adjustY = -0.02*dimension;
    }
    else {
      textSize(0.08*dimension);
      adjustY = -0.01*dimension;
    }
    textFont(font);
    text(this.text,this.button.x+this.button.width/2,
                   this.button.y+this.button.height/2+adjustY);
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
      //var fil = new p5.LowPass();
      osc.setType('sine');
      osc.amp(env);
      /*osc.disconnect();
      osc.connect(fil);
      fil.amp(1);
      fil.freq(maxFreq);*/
      osc.start();
      this.voices.push([-1,osc,env]);//,fil]);
    }
  }

  noteAttack(pit,vel) {
    var frq = 16.3515*exp(pit*log(2)/12);
    var voi = -1;
    for(let v = 0; v < this.voices.length; v++) {
      var voice = this.voices[v];
      if(voice[0] == pit) {
        voi = v;
        break;
      }
    }
    if(voi == -1) {
      for(let v = 0; v < this.voices.length; v++) {
        var voice = this.voices[v];
        if(voice[0] == -1) {
          voi = v;
          break;
        }
      }
    }
    if(voi >= 0) {
      var voice = this.voices[voi]
      voice[0] = pit;
      voice[1].freq(frq);
      voice[2].set(t1,vel,t2,l2*vel,t3,l3);
      //voice[3].freq(vel*maxFreq+100);
      voice[2].triggerAttack();
    }
    else {
      console.log('Maximum number of voices reached.');
    }
  }

  noteAftertouch(pit,vel) {
    for(let v = 0; v < this.voices.length; v++) {
      var voice = this.voices[v];
      if(voice[0] == pit) {
        //voice[3].freq(vel*maxFreq+100);
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
        //voice[3].freq(maxFreq);
        break;
      }
    }
  }
}

class Launchpad {
  constructor() {
    this.isOn = false;
    this.output = null;
    this.lightGrid = [];
    for(let r = 0; r < 8; r++) {
      var row = [];
      for(let c = 0; c < 8; c++) {
        row.push(false);
      }
      this.lightGrid.push(row);
    }
  }

  turnOn(output) {
    if(output == 'Launchpad Note') {
      for(let o = 0; o < WebMidi.outputs.length; o++) {
        if(WebMidi.outputs[o].name.includes('Launchpad Light')) {
          this.output = WebMidi.outputs[o];
        }
      }
    }
    else {
      this.output = WebMidi.outputs[output];
    }
    this.output.send(noteOnStatus,[10,degToColor(1,true)]);
    this.isOn = true;
    this.update();
  }

  sendControlColumn() {
    for(let d = 2; d <= 7; d++) {
      this.output.send(noteOnStatus,[d*10,fonDeg?degToColor(d,true):0]);
    }
  }

  update() {
    if(fonDeg) {
      var d = (8-fonDeg)%7+1;
      for(var r = 0; r < 8; r++) {
        for(var c = 0; c < 8; c++) {
          var color;
          if(this.lightGrid[r][c]) {
            color = 3;
          }
          else {
            color = degToColor(d,true);
          }
          this.output.send(noteOnStatus,[(r+1)*10+c+1,color]);
          d = d%7+1;
        }
        d = (d+2)%7+1;
      }
    }
    else {
      for(var r = 0; r < 8; r++) {
        if(r && r < 7) {
          this.output.send(noteOnStatus,[(r+1)*10,0]);
        }
        for(var c = 0; c < 8; c++) {
          var color;
          if(this.lightGrid[r][c]) {
            color = 3;
          }
          else {
            color = 0;
          }
          this.output.send(noteOnStatus,[(r+1)*10+c+1,color]);
        }
      }
    }
  }

  noteOn(row,col) {
    var color = 3;
    this.lightGrid[row][col] = true;
    this.output.send(noteOnStatus,[(row+1)*10+col+1,color]);
    if(col < 4) {
      if(row > 0) {
        this.lightGrid[row-1][col+4] = true;
        this.output.send(noteOnStatus,[row*10+col+5,color]);
      }
    }
    else {
      if(row < 7) {
        this.lightGrid[row+1][col-4] = true;
        this.output.send(noteOnStatus,[(row+2)*10+col-3,color]);
      }
    }
  }

  noteOff(row,col) {
    //var color = degToColor(deg,true);
    this.lightGrid[row][col] = false;
    //this.output.send(noteOnStatus,[(row+1)*10+col+1,color]);
    if(col < 4) {
      if(row > 0) {
        this.lightGrid[row-1][col+4] = false;
        //this.output.send(noteOnStatus,[row*10+col+5,color]);
      }
    }
    else {
      if(row < 7) {
        this.lightGrid[row+1][col-4] = false;
        //this.output.send(noteOnStatus,[(row+2)*10+col-3,color]);
      }
    }
    this.update();
  }
}

class MidiHandler {
  constructor() {
    this.button = new Clickable();
    this.button.color = white;
    this.button.cornerRadius = 1000;
    this.button.stroke = black;
    this.button.text = '';
    this.button.onPress = function() {
      enableMidi();
    }
    this.update();
  }

  update() {
    let r = midiRadius*dimension;
    this.button.resize(2*r,2*r);
    this.button.locate(width/2 -r,
                       height/2-r);
    this.button.strokeWeight = weight*dimension;
  }

  draw() {
    this.button.draw();

    noStroke();
    fill(this.button.color==white?black:white);
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
}

function preload() {
  font      = loadFont('nunito_light.ttf');
  fontLight = loadFont('nunito_extra_light.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  launchpad = new Launchpad();

  for(let d = 1; d <= 7; d++) {
    notes.push(new Note(d));
  }

  midiHandler = new MidiHandler();

  userStartAudio().then(function() {
     console.log('Audio ready');
   });
}

function draw() {
  background(white);

  //console.log(launchpad.lightGrid);

  noFill();
  stroke(black);
  strokeWeight(weight*dimension);
  circle(width/2,height/2,2*bigRadius*dimension,2*bigRadius*dimension);

  for(let n = 0; n < 12; n++) {
    let a = PI/2 - n*PI/6;
    let r = bigRadius*dimension;
    let dr = 0.65*littleRadius*dimension;
    if(n < 6 && tritons[n]) {
      line(width/2+(r+dr)*cos(a),height/2-(r+dr)*sin(a),
           width/2+(r+dr)*cos(a+PI),height/2-(r+dr)*sin(a+PI));
    }
    else if(!tritons[n%6]) {
      line(width/2+(r+dr)*cos(a),height/2-(r+dr)*sin(a),
           width/2+(r-dr)*cos(a),height/2-(r-dr)*sin(a));
    }
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
    if(dragDist < dragLimit*dimension) {
      dragDist += sqrt(pow(mouseX-dragX,2)+pow(mouseY-dragY,2));
      notes[notePressed].draw();
    }
    else {
      notes[notePressed].move();
    }
  }

  if(!midi) {
    midiHandler.draw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  for(let n = 0; n < notes.length; n++) {
    notes[n].update();
  }

  midiHandler.update();
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
      var name = WebMidi.inputs[i].name;
      liste += '   ' + num.toString() + '   -   ' + name + '\n';
      if(name.includes('Progression')) {
        if(!WebMidi.inputs[i].hasListener('noteon',      'all', handleScale)) {
          WebMidi.inputs[i].addListener('noteon',        'all', handleScale);
        }
      }
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 1) {
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
      let name = midiInput.name;
      /*if(name == 'MIDIIN2 (Launchpad Pro)') {
        launchpad.turnOn('MIDIOUT2 (Launchpad Pro)');
        name += '.\nColours will be displayed on the matrix. Please put your Launchpad Pro into Programmer Mode';
      }*/
      if(name.includes('Launchpad Pro')) {
        let x = (WebMidi.inputs[num-2].name.includes('Launchpad Pro'));
        let y = (WebMidi.inputs[num  ].name.includes('Launchpad Pro'));
        var offset;
        if(!x && y) {
          offset = 0;
        }
        else if(x && y) {
          offset = 1;
        }
        else {
          offset = 2;
        }
        taille = WebMidi.outputs.length;
        for(let o = 0; o < taille-2; o++) {
          if(WebMidi.outputs[o  ].name.includes('Launchpad Pro') &&
             WebMidi.outputs[o+1].name.includes('Launchpad Pro') &&
             WebMidi.outputs[o+2].name.includes('Launchpad Pro')) {
            launchpad.turnOn(o+offset);
            name += '.\nColours will be displayed on the matrix. Please put your Launchpad Pro into Programmer Mode';
            taille -= 3;
            break;
          }
        }
      }
      else if(name.includes('Launchpad Note')) {
        launchpad.turnOn('Launchpad Note');
        name += '.\nColours will be displayed on the matrix. Please put your Launchpad Pro into Programmer Mode';
      }
      window.alert('Input selected: ' + name + '.');
      if(!midiInput.hasListener('noteon',      'all', handleNoteOn)) {
        midiInput.addListener('noteon',        'all', handleNoteOn);
        midiInput.addListener('keyaftertouch', 'all', handleAftertouch);
        midiInput.addListener('noteoff',       'all', handleNoteOff);
        midiInput.addListener('controlchange', 'all', handleControl);
      }
      midi = 1;
      //midiButton.color  = black;
      //midiButton.stroke = white;
    }

    //--------------------OUTPUT--------------------

    liste = '';
    //taille = WebMidi.outputs.length;
    numStr = '0';

    if(taille == 0) {
      window.alert("No MIDI output device detected.");
      return;
    }

    num = 1;
    for(let i = 0; i < taille; i++) {
      var name = WebMidi.outputs[i].name;
        liste += '   ' + num.toString() + '   -   ' + name + '\n';
        num++;
      if(name.includes('Sequencer')) {
        hasSequencer = true;
        sequencerOutput = WebMidi.outputs[i];
      }
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 1) {
      numStr = window.prompt("Write the number of the desired MIDI output device:\n\n"+liste+"\nCancel this pop-up to use the integrated synth.");
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      window.alert("No MIDI output selected. A sinewave polyphonic synth will be used as output.");
      synth = new PolySynth(6);
      return;
    }
    else {
      midiOutput = WebMidi.outputs[num-1];
      window.alert('Output selected: ' + midiOutput.name + '.');
      midi = 2;
    }
  },true);
}

//--------------------EVENTS--------------------

var oct0 = 3;

function handleNoteOn(e) {
  var deg, oct;
  var num = e.note.number;
  if(launchpad.isOn) {
    let row = Math.floor(num/10)-1;
    let col = num%10-1;
    launchpad.noteOn(row,col);
    deg = (col+4*row)%7+1;
    oct = oct0+Math.floor((col+4*row)/7);
  }
  else {
    deg = ndtToDeg(num%12);
    oct = e.note.octave+1;
  }
  if(deg) {
    if(nextNote) {
      triggerColors(deg);
    }
    var vel = e.velocity;
    num = notes[deg-1].midiNumber(oct);
    number[7*oct+deg-1] = num;
    if(midi == 2) {
      midiOutput.send(e.data[0],[num,e.data[2]]);
    }
    else {
      synth.noteAttack(num,vel);
    }
    if(hasSequencer) {
      sequencerOutput.send(e.data[0],[7*oct+deg-1,fonDeg?(deg-fonDeg+7)%7+1:8]);
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
    var n0 = notes[deg-1].n;
    for(var d = 1; d <= 7; d++) {
      if(d != deg && notesOn[d-1].length) {
        var n1 = ndt(notesOn[d-1][0][0]);
        if(ndt(n1-n0) == 6) {
          tritons[Math.min(n0,n1)] = true;
        }
      }
    }
  }
}

function handleAftertouch(e) {
  var deg, oct;
  var num = e.note.number;
  if(launchpad.isOn) {
    let row = Math.floor(num/10)-1;
    let col = num%10-1;
    deg = (col+4*row)%7+1;
    oct = oct0+Math.floor((col+4*row)/7);
  }
  else {
    deg = ndtToDeg(num%12);
    oct = e.note.octave+1;
  }
  if(deg) {
    var vel = e.value;
    num = number[7*oct+deg-1];
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
  var deg, oct;
  var row, col;
  var num = e.note.number;
  if(launchpad.isOn) {
    row = Math.floor(num/10)-1;
    col = num%10-1;
    deg = (col+4*row)%7+1;
    oct = oct0+Math.floor((col+4*row)/7);
  }
  else {
    deg = ndtToDeg(num%12);
    oct = e.note.octave+1;
  }
  if(deg) {
    num = number[7*oct+deg-1];

    /*if(midi == 2) {
      midiOutput.send(e.data[0],[num,e.data[2]]);
    }
    else {
      synth.noteRelease(num);
    }*/

    var l = notesOn[deg-1].length;
    for(let i = 0; i < l; i++) {
      if(notesOn[deg-1][i][0] == num) {
        notesOn[deg-1].splice(i,1);
        l--;
        break;
      }
    }

    var lm = 0;
    for(let i = 0; i < l; i++) {
      if(notesOn[deg-1][i][0] == num) {
        lm++;
      }
    }
    if(!lm) {
      if(midi == 2) {
        midiOutput.send(e.data[0],[num,e.data[2]]);
      }
      else {
        synth.noteRelease(num);
      }
      if(hasSequencer) {
        sequencerOutput.send(e.data[0],[7*oct+deg-1,e.data[2]]);
      }
      if(launchpad.isOn) {
        launchpad.noteOff(row,col);
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

      var n0 = ndt(num);
      for(var d = 1; d <= 7; d++) {
        if(d != deg && notesOn[d-1].length) {
          var n1 = ndt(notesOn[d-1][0][0]);
          if(ndt(n1-n0) == 6) {
            tritons[Math.min(n0,n1)] = false;
          }
        }
      }
    }
  }
}

function handleControl(e) {
  if(launchpad.isOn) {
    if(e.controller.number == 10) {
      if(e.value == 127) {
        nextNote = true;
        launchpad.output.send(noteOnStatus,[10,3]);
      }
      else if(nextNote) {
        nextNote = false;
        launchpad.output.send(noteOnStatus,[10,degToColor(1,true)]);
      }
    }
    else if(fonDeg) {
      for(var d = 2; d <= 7; d++) {
        if(e.controller.number == d*10) {
          if(e.value == 127) {
            launchpad.output.send(noteOnStatus,[d*10,3]);
            var n = (fonDeg+d-2)%7;
            var nAv = ndt(notes[n].n-notes[(n+6)%7].n)-1;
            var nAp = ndt(notes[(n+1)%7].n-notes[n].n)-1;
            if(nAv && !nAp) {
              notes[n].n = ndt(notes[n].n-1);
            }
            else if(!nAv && nAp) {
              notes[n].n = ndt(notes[n].n+1);
            }
            else if(nAv && nAp) {
              var a = alt(ndt(notes[n].n-notes[fonDeg-1].n)-degToNdt(notes[n].d-notes[fonDeg-1].d+1));
              if(a > 0 || (!a && d != 4)) {
                notes[n].n = ndt(notes[n].n-1);
              }
              else { // a < 0
                notes[n].n = ndt(notes[n].n+1);
              }
            }
            notes[n].angle = PI/2 - notes[n].n*PI/6;
            notes[n].updateText();
            notes[n].update();
          }
          else {
            launchpad.output.send(noteOnStatus,[d*10,degToColor(d,true)]);
          }
        }
      }
      /*if(e.controller.number == 80) {
        if(e.value == 127) {
          launchpad.output.send(noteOnStatus,[80,3]);
        }
        else {
          launchpad.output.send(noteOnStatus,[80,0]);
        }
      }*/
    }
  }
}

function handleScale(e) {
  if(hasSequencer) {
    sequencerOutput.send(e.data[0],[e.data[1],e.data[2]]);
  }
  if(millis()-millisecond > 20) {
    millisecond = millis();
    midiScale = [[e.note.number,e.rawVelocity]];
  }
  else {
    midiScale.push([e.note.number,e.rawVelocity]);
  }
  if(midiScale.length == 7) {
    midiScale.sort(function (a, b) {
      return a[0] - b[0];
    });
    triggerColors(midiScale[0][1],true);
    let i = fonDeg-1;
    for(let d = 1; d <= 7; d++) {
      var note = notes[i];
      note.n = midiScale[d-1][0]%12;
      note.angle = PI/2 - note.n*PI/6;
      note.updateText();
      note.update();
      i++;
      i %= 7;
    }
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
