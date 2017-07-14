
var path = require('path')

var midi = require('midi');
var osc = require('node-osc');

var menubar = require('menubar');
var {remote, app, Menu, MenuItem, Tray} = require('electron');

var AutoLaunch = require('auto-launch');

var autoLauncher = new AutoLaunch({
    name: 'powermate2midi'
});
autoLauncher.enable();


var iconPath = path.join(__dirname, "powermate-22.jpg");
var mb = menubar({icon:iconPath, width:200, height:100, windowPosition:"trayLeft"})

mb.on('ready', function ready () {
  var setup, teardown;
  var forwardingMidi = true;
  var forwardingOsc = false;

  // your app code here
  var menu = new Menu();
  menu.append(new MenuItem({label: 'Send as MIDI', type: 'checkbox', checked: true, click:(menuItem, browserWindow, event)=>{
    if(menuItem.checked) {
      console.log("MIDI ON");
      forwardingMidi = true;
      setup();
    } else {
      console.log("MIDI OFF");
      forwardingMidi = false;
      setup();
    }
  }}));
  menu.append(new MenuItem({enabled:false, label: 'Send as OSC', type: 'checkbox', checked: false, click:(menuItem, browserWindow, event)=>{
    if(menuItem.checked) {
      console.log("OSC ON");
      forwardingOsc = true;
      setup();
    } else {
      console.log("OSC OFF");
      forwardingOsc = false;
      setup();
    }
  }}));
  menu.append(new MenuItem({label: 'Start at login', type: 'checkbox', checked: true, click:(menuItem, browserWindow, event)=>{
    if(menuItem.checked) {
      autoLauncher.enable();
    } else {
      autoLauncher.disable();
    }
  }}));

  menu.append(new MenuItem({type:"separator"}));
  menu.append(new MenuItem({label:"Quit", click:mb.app.quit}));

  mb.tray.setContextMenu(menu);

  var midiOut = null;
  var oscOut = null;//
  var PipePowerMate = require('./PipePowerMate');

  //Count powermates
  var powerMates = [];
  var deviceCount = PipePowerMate.countPowerMate();



  setup = ()=>{
    teardown();

    if(forwardingMidi){
      midiOut = new midi.output();
      midiOut.openVirtualPort('PowerMate');
    }
    if(forwardingOsc) {
      oscOut = new osc.Client('127.0.0.1', 8001);
    }
    for(var i=0;i<deviceCount;i++){
      powerMates.push(new PipePowerMate(i, midiOut, oscOut, 0, 1000));
    }
  }
  teardown = ()=> {
    for(var i=0, len = powerMates.length;i<len;i++){
      powerMates[i].close();
    }
    powerMates = [];
    if(midiOut) {
      midiOut.closePort();
      midiOut = null;
    }
    if(oscOut) oscOut.kill();
  }

  setup();

  var quitAll = () => {
    if(mb.tray) mb.tray.destroy();
    teardown();
    process.exit(0);
  }

  process.on('SIGINT', quitAll);
  process.on('SIGTERM', quitAll);
  mb.app.on('window-all-closed', mb.app.quit);
  mb.app.on('before-quit', quitAll);

});
