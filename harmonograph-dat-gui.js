"use strict";

function DatGuiHarmonographGui(harmonograph) {
    this.harmonograph = harmonograph;

    this.params = {
        'animate': false,
        'precision': 25
    };

    this.gui = new dat.GUI({width: 300});

    this.animateController = this.gui.add(this.params, 'animate');
}

DatGuiHarmonographGui.prototype.onAnimate = function(callback) {
    gui.animateController.onFinishChange(callback);
};