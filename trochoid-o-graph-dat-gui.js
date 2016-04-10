"use strict";

Oscillator.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this.position, 'x'),
        gui.add(this.position, 'y'),
        gui.add(this, 'scale').min(0).name("Scale"),
        gui.add(this, '_R').min(0).name("Main radius"),
        gui.add(this, '_r').min(0).name("Satellite radius"),
        gui.add(this, '_d').min(0).name("Dist. to satellite"),
        gui.add(this, '_period').name("Period (per rev.)"),
        gui.add(this, 'phase1').min(0).max(2 * Math.PI).name("Main phase"),
        gui.add(this, 'phase2').min(0).max(2 * Math.PI).name("Satellite phase")
    ];
};

Epitrochoide.prototype.addControllers = Oscillator.prototype.addControllers;
Hypotrochoide.prototype.addControllers = Oscillator.prototype.addControllers;

SimpleArticulatedArm.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this, 'l').min(0).name("Left arm"),
        gui.add(this, 'r').min(0).name("Right arm")
    ];
};

Pantograph.prototype.addControllers = function(gui) {
    this.controllers = [
        gui.add(this, 'l1').min(0).name("Left arm (part 1)"),
        gui.add(this, 'r1').min(0).name("Right arm (part 1)"),
        gui.add(this, 'l2').min(0).name("Left arm (part 2)"),
        gui.add(this, 'r2').min(0).name("Right arm (part 2)"),
        gui.add(this, 'l3').min(0).name("Left arm (part 3)"),
        gui.add(this, 'r3').min(0).name("Right arm (part 3)")
    ];
};

function DatGuiOscillatingDrawingMachineGui(machine) {
    this.ArmTypes        = [ 'SimpleArticulatedArm', 'Pantograph' ];
    this.OscillatorTypes = [ 'Epitrochoide', 'Hypotrochoide' ];

    this.machine = machine;

    this.params = {
        'armType':             'Pantograph',
        'leftOscillatorType':  'Epitrochoide',
        'rightOscillatorType': 'Hypotrochoide',
        'animate':             false
    };

    this.gui = new dat.GUI({width: 300});

    this.animateController = this.gui.add(this.params, 'animate');

    this.armFolder      = this.gui.addFolder('Arms');
    this.leftOscFolder  = this.gui.addFolder('Left oscillator');
    this.rightOscFolder = this.gui.addFolder('Right oscillator');

    this.armController      = this.armFolder.add(this.params, 'armType', this.ArmTypes).name("Type");
    this.leftOscController  = this.leftOscFolder.add(this.params, 'leftOscillatorType', this.OscillatorTypes).name("Type");
    this.rightOscController = this.rightOscFolder.add(this.params, 'rightOscillatorType', this.OscillatorTypes).name("Type");

    this.machine.arm.addControllers(this.armFolder);
    this.machine.left.addControllers(this.leftOscFolder);
    this.machine.right.addControllers(this.rightOscFolder);

    this.armFolder.open();
    this.leftOscFolder.open();
    this.rightOscFolder.open();
}

DatGuiOscillatingDrawingMachineGui.prototype.onAnimate = function(callback) {
    gui.animateController.onFinishChange(callback);
};

DatGuiOscillatingDrawingMachineGui.prototype.onArmChange = function(onArmUpdateCallback, redrawCallback) {
    var that = this;
    that.armController.onFinishChange(function(value) {
        for (var c of that.machine.arm.controllers) {
            that.armFolder.remove(c);
        }

        var minimumArmLength = that.machine.minimumArmLength();

        if(value == 'SimpleArticulatedArm') {
            that.machine.arm = new SimpleArticulatedArm(minimumArmLength / 2 * 1.01, minimumArmLength / 2 * 1.01);
        } else if(value == 'Pantograph') {
            that.machine.arm = new Pantograph(minimumArmLength / 2 * 1.01, minimumArmLength / 2 * 1.01, 100, 100, 110, 110);
        }

        that.machine.arm.addControllers(that.armFolder);
        that.onArmUpdate(onArmUpdateCallback);

        redrawCallback();
    });
};

DatGuiOscillatingDrawingMachineGui.prototype.onLeftOscillatorChange = function(onLeftOscillatorUpdateCallback, redrawCallback) {
    var that = this;
    that.leftOscController.onFinishChange(function(value) {
        var g = that.machine;
        for (var c of g.left.controllers) {
            that.leftOscFolder.remove(c);
        }

        if(value == 'Epitrochoide') {
            g.left = new Epitrochoide(g.left.position, g.left.scale, g.left._R, g.left._r, g.left._d, g.left._period, g.left.phase1, g.left.phase2);
        } else if(value == 'Hypotrochoide') {
            g.left = new Hypotrochoide(g.left.position, g.left.scale, g.left._R, g.left._r, g.left._d, g.left._period, g.left.phase1, g.left.phase2);
        }

        g.left.addControllers(that.leftOscFolder);
        that.onLeftOscillatorUpdate(onLeftOscillatorUpdateCallback);

        redrawCallback();
    });
};

DatGuiOscillatingDrawingMachineGui.prototype.onRightOscillatorChange = function(onRightOscillatorUpdateCallback, redrawCallback) {
    var that = this;
    that.rightOscController.onFinishChange(function(value) {
        var g = that.machine;
        for (var c of g.right.controllers) {
            that.rightOscFolder.remove(c);
        }

        if(value == 'Epitrochoide') {
            g.right = new Epitrochoide(g.right.position, g.right.scale, g.right._R, g.right._r, g.right._d, g.right._period, g.right.phase1, g.right.phase2);
        } else if(value == 'Hypotrochoide') {
            g.right = new Hypotrochoide(g.right.position, g.right.scale, g.right._R, g.right._r, g.right._d, g.right._period, g.right.phase1, g.right.phase2);
        }

        g.right.addControllers(that.rightOscFolder);
        that.onRightOscillatorUpdate(onRightOscillatorUpdateCallback);

        redrawCallback();
    });
};

DatGuiOscillatingDrawingMachineGui.prototype.onArmUpdate = function(callback) {
    for (var c of this.machine.arm.controllers) {
        c.onFinishChange(callback);
    }
};

DatGuiOscillatingDrawingMachineGui.prototype.onLeftOscillatorUpdate = function(callback) {
    for (var c of this.machine.left.controllers) {
        c.onFinishChange(callback);
    }
};

DatGuiOscillatingDrawingMachineGui.prototype.onRightOscillatorUpdate = function(callback) {
    for (var c of this.machine.right.controllers) {
        c.onFinishChange(callback);
    }
};
