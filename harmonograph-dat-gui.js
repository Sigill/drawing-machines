"use strict";

Pendulum.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this, 'period').name("Period"),
        gui.add(this, 'phase').min(0).max(2 * Math.PI).name("Phase"),
        gui.add(this, 'amplitude').min(0).name("Amplitude"),
    ];
};

StaticBoard.prototype.addControllers = function(gui) {
    this.controllers = [];
};

RotatingBoard.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this, 'period').name("Period")
    ];
};

SwingingBoard.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this.x, 'period').name("Period X"),
        gui.add(this.x, 'phase').min(0).max(2 * Math.PI).name("Phase X"),
        gui.add(this.x, 'amplitude').min(0).name("Amplitude X"),

        gui.add(this.y, 'period').name("Period Y"),
        gui.add(this.y, 'phase').min(0).max(2 * Math.PI).name("Phase Y"),
        gui.add(this.y, 'amplitude').min(0).name("Amplitude Y"),
    ];
};

function DatGuiHarmonographGui(harmonograph) {
    this.harmonograph = harmonograph;

    this.BoardTypes  = [ 'Static', 'Rotating', 'Swinging' ];
    this.DamperTypes = ['Linear', 'Exponential'];

    this.params = {
        'animate': false,
        'boardType':  'Swinging',
        'speed': 120,
        'precision': 1,
        'damper': 'Linear',
        'term': 10000,
    };

    this.gui = new dat.GUI({width: 300});

    this.animateController   = this.gui.add(this.params, 'animate');
    this.speedController     = this.gui.add(this.params, 'speed');
    this.precisionController = this.gui.add(this.params, 'precision');
    this.damperTypeController = this.gui.add(this.params, 'damper', this.DamperTypes);
    this.termController     = this.gui.add(this.params, 'term');

    this.xPendulumFolder = this.gui.addFolder('X Pendulum');
    this.yPendulumFolder = this.gui.addFolder('Y Pendulum');
    this.boardFolder     = this.gui.addFolder('Board');

    this.harmonograph.x.addControllers(this.xPendulumFolder);
    this.harmonograph.y.addControllers(this.yPendulumFolder);

    this.boardController = this.boardFolder.add(this.params, 'boardType', this.BoardTypes).name("Type");
    this.harmonograph.board.addControllers(this.boardFolder);

    this.xPendulumFolder.open();
    this.yPendulumFolder.open();
    this.boardFolder.open();
}

DatGuiHarmonographGui.prototype.onAnimate = function(callback) {
    gui.animateController.onFinishChange(callback);
};

DatGuiHarmonographGui.prototype.onSpeedChange = function(callback) {
    gui.speedController.onFinishChange(callback);
};

DatGuiHarmonographGui.prototype.onPrecisionChange = function(callback) {
    gui.precisionController.onFinishChange(callback);
};

DatGuiHarmonographGui.prototype.onTermChange = function(callback) {
    gui.termController.onFinishChange(callback);
};

DatGuiHarmonographGui.prototype.onDamperTypeChange = function(callback) {
    gui.damperTypeController.onFinishChange(callback);
};

DatGuiHarmonographGui.prototype.onXPendulumUpdate = function(callback) {
    for (var c of this.harmonograph.x.controllers) {
        c.onFinishChange(callback);
    }
};

DatGuiHarmonographGui.prototype.onYPendulumUpdate = function(callback) {
    for (var c of this.harmonograph.y.controllers) {
        c.onFinishChange(callback);
    }
};


DatGuiHarmonographGui.prototype.onBoardChange = function(onBoardUpdateCallback, redrawCallback) {
    var that = this;
    that.boardController.onFinishChange(function(boardType) {
        for (var c of that.harmonograph.board.controllers) {
            that.boardFolder.remove(c);
        }

        that.harmonograph.setBoard(boardType);

        that.harmonograph.board.addControllers(that.boardFolder);
        that.onBoardUpdate(onBoardUpdateCallback);

        redrawCallback();
    });
};

DatGuiHarmonographGui.prototype.onBoardUpdate = function(callback) {
    for (var c of this.harmonograph.board.controllers) {
        c.onFinishChange(callback);
    }
};
