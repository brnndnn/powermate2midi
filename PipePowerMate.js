var HID = require('node-hid');
var PowerMate = require('node-powermate');

var PipePowerMate = function(index, midiOut, oscOut, oscMin, oscMax){
  this.channel = index;
  this.midiOut = midiOut;
  this.oscOut = oscOut;
  this.oscMin = oscMin || 0;
  this.oscMax = oscMax || 127;
  this.powerMate = new PowerMate(index);
  this.curMidiValueUp = 0;
  this.curMidiValueDown = 0;
  this.curOscValueUp = 0;
  this.curOscValueDown = 0;

  this.buttonDown = false;

  var self = this;
  this.powerMate.on('buttonDown', ()=>{
    this.buttonDown = true;
  });
  this.powerMate.on('buttonUp', ()=>{
    this.buttonDown = false;
  });
  this.powerMate.on('wheelTurn', (wheelDelta)=>{
    if(this.buttonDown){
      if(this.midiOut) {
        console.log("[midi] down: "+wheelDelta);
        this.midiWheelOutDown(wheelDelta);
      }
      if(this.oscOut){
        console.log("[osc] down: "+wheelDelta);
        this.oscWheelOutDown(wheelDelta);
      }
    } else {
      if(this.midiOut) {
        console.log("[midi] up: "+wheelDelta);
        this.midiWheelOutUp(wheelDelta);
      }
      if(this.oscOut){
        console.log("[osc] up: "+wheelDelta);
        this.oscWheelOutUp(wheelDelta);
      }
    }
  });
  // this.powerMate.on('disconnected', function(){
  //   console.log("disconnected");
  //   // this.close();
  // });
};

PipePowerMate.countPowerMate = function(){
  var devices = HID.devices();
  var count = 0;
  if(devices){
    for(var i=0; i<devices.length; i++){
      if(devices[i].product === 'Griffin PowerMate') count++;
    }
  }
  return count;
};
PipePowerMate.notifyDevicesChanged = function(callback = ()=>{}, prevCount = 0){
  var count = PipePowerMate.countPowerMate();

  if(count != prevCount){
    console.log("PowerMate devices changed");
    callback();
  }

  setTimeout( () => { // this line should be changed to be more async
    process.nextTick( () => { PipePowerMate.notifyDevicesChanged( callback, count ) } );
  }, 100 );
};


PipePowerMate.prototype.midiWheelOutUp = function(value){
  this.curMidiValueUp += value;
  // TODO: option for forwarding relative rather than absolute values
  if(this.curMidiValueUp>127) this.curMidiValueUp=127;
  if(this.curMidiValueUp<0) this.curMidiValueUp=0;

  //Send control change message
  this.midiOut.sendMessage([176+this.channel,this.channel,this.curMidiValueUp]);
};

PipePowerMate.prototype.midiWheelOutDown = function(value){
  this.curMidiValueDown += value;
  // TODO: option for forwarding relative rather than absolute values
  if(this.curMidiValueDown>127) this.curMidiValueDown=127;
  if(this.curMidiValueDown<0) this.curMidiValueDown=0;

  //Send control change message
  this.midiOut.sendMessage([177+this.channel,this.channel,this.curMidiValueDown]);
};

PipePowerMate.prototype.oscWheelOutUp = function(value){
  this.curOscValueUp += value;
  if(this.curOscValueUp>this.oscMax) this.curOscValueUp=this.oscMax;
  if(this.curOscValueUp<this.oscMin) this.curOscValueUp=this.oscMin;
  this.oscOut.send('/pmWheelTurn', this.channel, this.curOscValueUp);
};
PipePowerMate.prototype.oscWheelOutDown = function(value){
  this.curOscValueDown += value;
  if(this.curOscValueDown>this.oscMax) this.curOscValueDown=this.oscMax;
  if(this.curOscValueDown<this.oscMin) this.curOscValueDown=this.oscMin;
  this.oscOut.send('/pmWheelDownTurn', this.channel, this.curOscValueDown);
};

PipePowerMate.prototype.close = function(value){
  this.powerMate.close();
};

module.exports = PipePowerMate;
