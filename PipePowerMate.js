var HID = require('node-hid');
var PowerMate = require('node-powermate');

var PipePowerMate = function(index, midiOut, oscOut, oscMin, oscMax){
  this.channel = index;
  this.midiOut = midiOut;
  this.oscOut = oscOut;
  this.oscMin = oscMin || 0;
  this.oscMax = oscMax || 127;
  this.powerMate = new PowerMate(index);
  this.curMidiValue = 0;
  this.curOscValue = 0;

  var self = this;
  this.powerMate.on('wheelTurn', function(wheelDelta){
    if(self.midiOut) self.midiWheelOut(wheelDelta);
    if(self.oscOut) self.oscWheelOut(wheelDelta);
  });
};

PipePowerMate.countPowerMate = function(){
  var devices = HID.devices();
  var count = 0;
  for(var i=0,len=devices.length;i<len;i++){
    if(devices[i].product === 'Griffin PowerMate') count++;
  }

  return count;
};

PipePowerMate.prototype.midiWheelOut = function(value){
  this.curMidiValue += value;
  if(this.curMidiValue>127) this.curMidiValue=127;
  if(this.curMidiValue<0) this.curMidiValue=0;

  //Send control change message
  this.midiOut.sendMessage([176,this.channel,this.curMidiValue]);
};

PipePowerMate.prototype.oscWheelOut = function(value){
  this.curOscValue += value;
  if(this.curOscValue>this.oscMax) this.curOscValue=this.oscMax;
  if(this.curOscValue<this.oscMin) this.curOscValue=this.oscMin;
  this.oscOut.send('/pmWheelTurn', this.channel, this.curOscValue);
};

PipePowerMate.prototype.close = function(value){
  this.powerMate.close();
};

module.exports = PipePowerMate;
