"use strict";

function GuiObject(guiFolder, parameters, keys, controllers) {
    this.guiFolder     = guiFolder;
    this.parameters    = parameters;
    this.parameterKeys = keys;
    this.controllers   = controllers;
}

GuiObject.prototype.destroy = function() {
    for (var i = 0, l = this.controllers.length; i < l; ++i) { this.guiFolder.remove(this.controllers[i]); }
    for (var i = 0, l = this.parameterKeys.length; i < l; ++i) { delete this.parameters[this.parameterKeys[i]]; }
};

function OscillatorGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'x', 'y', 'scale', '_R', '_r', '_d', '_period', 'phase1', 'phase2' ],
        [ guiFolder.add(parameters, 'x'),
          guiFolder.add(parameters, 'y'),
          guiFolder.add(parameters, 'scale').min(0).name("Scale"),
          guiFolder.add(parameters, '_R').min(1).step(1).name("Main radius"),
          guiFolder.add(parameters, '_r').min(0).step(1).name("Satellite radius"),
          guiFolder.add(parameters, '_d').min(0).step(1).name("Dist. to satellite"),
          guiFolder.add(parameters, '_period').step(1).name("Period (per rev.)"),
          guiFolder.add(parameters, 'phase1').min(0).max(2 * Math.PI).step(0.1).name("Main phase"),
          guiFolder.add(parameters, 'phase2').min(0).max(2 * Math.PI).step(0.1).name("Satellite phase") ]);
}

Extend(OscillatorGui, GuiObject);


function SimpleArticulatedArmGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'l', 'r' ],
        [ guiFolder.add(parameters, 'l').min(0).name("Left arm"),
          guiFolder.add(parameters, 'r').min(0).name("Right arm") ]);
}

Extend(SimpleArticulatedArmGui, GuiObject);


function PantographGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'l1', 'r1', 'l2', 'r2', 'l3', 'r3' ],
        [ guiFolder.add(parameters, 'l1').min(0).name("Left arm (part 1)"),
          guiFolder.add(parameters, 'r1').min(0).name("Right arm (part 1)"),
          guiFolder.add(parameters, 'l2').min(0).name("Left arm (part 2)"),
          guiFolder.add(parameters, 'r2').min(0).name("Right arm (part 2)"),
          guiFolder.add(parameters, 'l3').min(0).name("Left arm (part 3)"),
          guiFolder.add(parameters, 'r3').min(0).name("Right arm (part 3)") ]);
}

Extend(PantographGui, GuiObject);


function CanvasDrawingMachineDatGui(machineChangedCallback, speedChangedCallback, animateCallback, showMessageCallback) {
    this.machineChangedCallback = machineChangedCallback;
    this.showMessageCallback = showMessageCallback;
    this.gui = new dat.GUI({width: 300});
    this.MachinesTypes = [ 'Pintograph', 'Harmonograph' ];
    this.parameters = {
        'machineType': this.MachinesTypes[0],
        'animate'    : false,
        'speed'      : 120
    };

    var machineTypeController = this.gui.add(this.parameters, 'machineType', this.MachinesTypes).name("Machine type");
    machineTypeController.onFinishChange(this.loadMachineGui.bind(this));

    this.animateController = this.gui.add(this.parameters, 'animate');
    this.speedController   = this.gui.add(this.parameters, 'speed').min(1);

    this.speedController.onFinishChange(speedChangedCallback);
    this.animateController.onFinishChange(animateCallback);
}

CanvasDrawingMachineDatGui.prototype.loadMachineGui = function(type) {
    console.log("Switching to " + type);

    if (this.factory !== undefined) { this.factory.destroy(); }

    this.parameters['machineParameters'] = {};

    if (type == this.MachinesTypes[0]) { // Pintograph
        this.factory = new PintographDatGui(this.gui, this.parameters['machineParameters'], this.onMachineChange.bind(this));
    } else if (type == this.MachinesTypes[1]) { // Harmonograph
        this.factory = new HarmonographDatGui(this.gui, this.parameters['machineParameters'], this.onMachineChange.bind(this));
    }

    this.onMachineChange();
};

CanvasDrawingMachineDatGui.prototype.onMachineChange = function() {
    if (this.parameters['machineType'] == this.MachinesTypes[0]) { // Pintograph
        try {
            this.machineChangedCallback(new CanvasPintograph(this.parameters['machineParameters'], this.parameters['speed']));
            this.showMessageCallback(null);
        } catch (e) {
            this.showMessageCallback(e.message);
        }
    } else if (this.parameters['machineType'] == this.MachinesTypes[1]) { // Harmonograph
        this.machineChangedCallback(new CanvasHarmonograph(this.parameters['machineParameters'], this.parameters['speed']));
    }
};


function PintographDatGui(gui, parameters, machineChangedCallback) {
    this.ArmTypes        = [ 'SimpleArticulatedArm', 'Pantograph' ];
    this.OscillatorTypes = [ 'Epitrochoide', 'Hypotrochoide' ];
    this.gui = gui;
    this.machineChangedCallback = machineChangedCallback;

    this.parameters = Object.assign(parameters, {
        'armType'            : this.ArmTypes[0],
        'arm'                : {},
        'leftOscillatorType' : this.OscillatorTypes[0],
        'leftOscillator'     : {},
        'rightOscillatorType': this.OscillatorTypes[1],
        'rightOscillator'    : {}
    });

    this.armFolder      = gui.addFolder('Arms');
    this.leftOscFolder  = gui.addFolder('Left oscillator');
    this.rightOscFolder = gui.addFolder('Right oscillator');

    this.armTypeController  = this.armFolder.add(this.parameters, 'armType', this.ArmTypes).name("Type");
    this.leftOscController  = this.leftOscFolder.add(this.parameters, 'leftOscillatorType', this.OscillatorTypes).name("Type");
    this.rightOscController = this.rightOscFolder.add(this.parameters, 'rightOscillatorType', this.OscillatorTypes).name("Type");

    this.armTypeController.onFinishChange(this.handleArmChange.bind(this));
    this.leftOscController.onFinishChange(this.handleLeftOscillatorChange.bind(this));
    this.rightOscController.onFinishChange(this.handleRightOscillatorChange.bind(this));

    this.loadArmGui(this.ArmTypes[0]);
    this.loadLeftOscillatorGui(this.OscillatorTypes[0]);
    this.loadRightOscillatorGui(this.OscillatorTypes[1]);
}

PintographDatGui.prototype.destroy = function() {
    this.armGui.destroy();
    this.leftOscillatorGui.destroy();
    this.rightOscillatorGui.destroy();
    this.armFolder.remove(this.armTypeController);
    this.leftOscFolder.remove(this.leftOscController);
    this.rightOscFolder.remove(this.rightOscController);
    this.gui.removeFolder(this.armFolder);
    this.gui.removeFolder(this.leftOscFolder);
    this.gui.removeFolder(this.rightOscFolder);
};

PintographDatGui.prototype.handleArmChange = function(type) {
    this.loadArmGui(type);
    this.machineChangedCallback();
};

PintographDatGui.prototype.handleLeftOscillatorChange = function(type) {
    this.loadLeftOscillatorGui(type);
    this.machineChangedCallback();
};

PintographDatGui.prototype.handleRightOscillatorChange = function(type) {
    this.loadRightOscillatorGui(type);
    this.machineChangedCallback();
};

PintographDatGui.prototype.loadArmGui = function(type) {
    console.log("Switching to " + type);

    // Retrieve parameters from the previous arm
    var l, r;
    if (this.armGui === undefined) {
        l = r = 310;
    } else {
        if (type == this.ArmTypes[0]) {  // Simple
            l = this.parameters['arm']['l1'];
            r = this.parameters['arm']['r1'];
        } else if (type == this.ArmTypes[1]) { // Pantograph
            l = this.parameters['arm']['l'];
            r = this.parameters['arm']['r'];
        }

        this.armGui.destroy();
    }

    // Build the new arm gui
    if (type == this.ArmTypes[0]) { // Simple
        this.parameters['arm'] = {'l': l, 'r': r};
        this.armGui = new SimpleArticulatedArmGui(this.armFolder, this.parameters['arm']);
    } else if (type == this.ArmTypes[1]) { // Pantograph
        this.parameters['arm'] = {
            'l1': l,
            'r1': r,
            'l2': 100,
            'r2': 100,
            'l3': 110,
            'r3': 110 };
        this.armGui = new PantographGui(this.armFolder, this.parameters['arm']);
    }

    for (var i = 0, l = this.armGui.controllers.length; i < l; ++i) {
        this.armGui.controllers[i].onChange(this.machineChangedCallback);
    }
};

PintographDatGui.prototype.loadLeftOscillatorGui = function(type) {
    console.log("Switching to " + type);

    // Retrieve parameters from the previous oscillator
    var parameters = null;
    if (this.leftOscillatorGui === undefined) {
        parameters = {
            'x': 200,
            'y': 200,
            'scale': 10,
            '_R': 9,
            '_r': 0,
            '_d': 0,
            '_period': 100,
            'phase1': 0,
            'phase2': 0 };
    } else {
        parameters = JSON.parse(JSON.stringify(this.parameters['leftOscillator'])); // Deep copy
        this.leftOscillatorGui.destroy();
    }

    // Build the new oscillator gui
    if (type == this.OscillatorTypes[0] || type == this.OscillatorTypes[1]) {
        this.parameters['leftOscillator'] = parameters;
        this.leftOscillatorGui = new OscillatorGui(this.leftOscFolder, this.parameters['leftOscillator']);
    }

    for (var i = 0, l = this.leftOscillatorGui.controllers.length; i < l; ++i) {
        this.leftOscillatorGui.controllers[i].onChange(this.machineChangedCallback);
    }
};

PintographDatGui.prototype.loadRightOscillatorGui = function(type) {
    console.log("Switching to " + type);

    // Retrieve parameters from the previous oscillator
    var parameters = null;
    if (this.rightOscillatorGui === undefined) {
        parameters = {
            'x': 200,
            'y': 600,
            'scale': 30,
            '_R': 3,
            '_r': 1,
            '_d': 2,
            '_period': 98,
            'phase1': 0,
            'phase2': 0 };
    } else {
        parameters = JSON.parse(JSON.stringify(this.parameters['rightOscillator'])); // Deep copy
        this.rightOscillatorGui.destroy();
    }

    // Build the new oscillator gui
    if (type == this.OscillatorTypes[0] || type == this.OscillatorTypes[1]) {
        this.parameters['rightOscillator'] = parameters;
        this.rightOscillatorGui = new OscillatorGui(this.rightOscFolder, this.parameters['rightOscillator']);
    }

    for (var i = 0, l = this.rightOscillatorGui.controllers.length; i < l; ++i) {
        this.rightOscillatorGui.controllers[i].onChange(this.machineChangedCallback);
    }
};


function StaticBoardGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters, [], []);
}

Extend(StaticBoardGui, GuiObject);


function RotatingBoardGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'period' ],
        [ guiFolder.add(parameters, 'period').name("Period") ]);
}

Extend(RotatingBoardGui, GuiObject);


function SwingingBoardGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'period_x', 'phase_x', 'amplitude_x', 'period_y', 'phase_y', 'amplitude_y' ],
        [ guiFolder.add(parameters, 'period_x').min(1).name("Period X"),
          guiFolder.add(parameters, 'phase_x').min(0).max(2 * Math.PI).step(0.1).name("Phase X"),
          guiFolder.add(parameters, 'amplitude_x').name("Amplitude X"),

          guiFolder.add(parameters, 'period_y').min(1).name("Period Y"),
          guiFolder.add(parameters, 'phase_y').min(0).max(2 * Math.PI).step(0.1).name("Phase Y"),
          guiFolder.add(parameters, 'amplitude_y').name("Amplitude Y") ]);
}

Extend(SwingingBoardGui, GuiObject);


function PendulumGui(guiFolder, parameters) {
    GuiObject.call(this, guiFolder, parameters,
        [ 'period', 'phase', 'amplitude' ],
        [ guiFolder.add(parameters, 'period').min(1).name("Period"),
          guiFolder.add(parameters, 'phase').min(0).max(2 * Math.PI).step(0.1).name("Phase"),
          guiFolder.add(parameters, 'amplitude').name("Amplitude") ]);
}

Extend(PendulumGui, GuiObject);



function HarmonographDatGui(gui, parameters, machineChangedCallback) {
    this.BoardTypes  = [ 'Static', 'Rotating', 'Swinging' ];
    this.DamperTypes = [ 'Linear', 'Exponential' ];
    this.gui = gui;
    this.machineChangedCallback = machineChangedCallback;

    this.parameters = Object.assign(parameters, {
        'damperType':          this.DamperTypes[0],
        'damper':              {},
        'precision':           1,
        'term':                10000,
        'x_pendulum':          {},
        'y_pendulum':          {},
        'boardType':           this.BoardTypes[0],
        'board':               {}
    });

    this.precisionController   = gui.add(this.parameters, 'precision').min(0).name("Precision");
    this.damperTypeController  = gui.add(this.parameters, 'damperType', this.DamperTypes).name("Damper type");
    this.termController        = gui.add(this.parameters, 'term').min(1).step(1).name("Term");

    this.xPendulumFolder = gui.addFolder('X Pendulum');
    this.yPendulumFolder = gui.addFolder('Y Pendulum');
    this.boardFolder     = gui.addFolder('Board');

    this.boardTypeController = this.boardFolder.add(this.parameters, 'boardType', this.BoardTypes).name("Type");

    this.precisionController.onFinishChange(this.handleSimpleChange.bind(this));
    this.damperTypeController.onFinishChange(this.handleSimpleChange.bind(this));
    this.termController.onFinishChange(this.handleSimpleChange.bind(this));
    this.boardTypeController.onFinishChange(this.handleBoardChange.bind(this));

    this.loadBoardGui(this.BoardTypes[0]);
    this.loadXPendulumGui();
    this.loadYPendulumGui();
}

HarmonographDatGui.prototype.destroy = function() {
    this.boardGui.destroy();
    this.xPendulumGui.destroy();
    this.yPendulumGui.destroy();
    this.gui.remove(this.precisionController);
    this.gui.remove(this.damperTypeController);
    this.gui.remove(this.termController);
    this.boardFolder.remove(this.boardTypeController);
    this.gui.removeFolder(this.xPendulumFolder);
    this.gui.removeFolder(this.yPendulumFolder);
    this.gui.removeFolder(this.boardFolder);
};

HarmonographDatGui.prototype.handleSimpleChange = function(type) {
    this.machineChangedCallback();
};

HarmonographDatGui.prototype.handleBoardChange = function(type) {
    this.loadBoardGui(type);
    this.machineChangedCallback();
};

HarmonographDatGui.prototype.loadBoardGui = function(type) {
    console.log("Switching to " + type);

    if (this.boardGui !== undefined) {
        this.boardGui.destroy();
    }

    // Build the new board gui
    if (type == this.BoardTypes[0]) { // Static
        this.parameters['board'] = {};
        this.boardGui = new StaticBoardGui(this.boardFolder, this.parameters['board']);
    } else if (type == this.BoardTypes[1]) { // Rotating
        this.parameters['board'] = { 'period': 10 };
        this.boardGui = new RotatingBoardGui(this.boardFolder, this.parameters['board']);
    } else if (type == this.BoardTypes[2]) { // Swinging
        this.parameters['board'] = {
            'period_x': 10, 'phase_x': 0, 'amplitude_x': 100,
            'period_y': 10, 'phase_y': 0, 'amplitude_y': 100
        };
        this.boardGui = new SwingingBoardGui(this.boardFolder, this.parameters['board']);
    }

    for (var i = 0, l = this.boardGui.controllers.length; i < l; ++i) {
        this.boardGui.controllers[i].onChange(this.machineChangedCallback);
    }
};

HarmonographDatGui.prototype.loadXPendulumGui = function() {
    var parameters = { 'period': 25, 'phase': 0, 'amplitude': 400};

    if (this.xPendulumGui !== undefined) {
        this.xPendulumGui.destroy();
    }

    // Build the new oscillator gui
    this.parameters['x_pendulum'] = parameters;
    this.xPendulumGui = new PendulumGui(this.xPendulumFolder, this.parameters['x_pendulum']);

    for (var i = 0, l = this.xPendulumGui.controllers.length; i < l; ++i) {
        this.xPendulumGui.controllers[i].onChange(this.machineChangedCallback);
    }
};

HarmonographDatGui.prototype.loadYPendulumGui = function() {
    var parameters = { 'period': 20, 'phase': 0, 'amplitude': 400};

    if (this.yPendulumGui !== undefined) {
        this.yPendulumGui.destroy();
    }

    // Build the new oscillator gui
    this.parameters['y_pendulum'] = parameters;
    this.yPendulumGui = new PendulumGui(this.yPendulumFolder, this.parameters['y_pendulum']);

    for (var i = 0, l = this.yPendulumGui.controllers.length; i < l; ++i) {
        this.yPendulumGui.controllers[i].onChange(this.machineChangedCallback);
    }
};
