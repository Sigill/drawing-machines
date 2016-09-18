"use strict";

var Pendulum = function(frequency, phase, amplitude, damping) {
    this.frequency = frequency;
    this.phase     = phase;
    this.amplitude = amplitude;
    this.damping   = damping;
};

Pendulum.prototype.at = function(t) {
    return this.amplitude * Math.sin(t * this.frequency + this.phase) * Math.exp(-this.damping * t)
};

Pendulum.prototype.life = function() {
    // This threshold is the minimum amplitude of the pendulum
    var threshold = 0.5;
    return Math.ceil(Math.log(this.amplitude / threshold) / this.damping);
};


function StaticBoard() {}
StaticBoard.prototype.project = function(point, time) { return point; }
StaticBoard.prototype.transform = function(time, ctx) { }


function SwingingBoard(frequency_x, frequency_y, phase_x, phase_y, amplitude_x, amplitude_y, damping_x, damping_y) {
    this.x = new Pendulum(frequency_x, phase_x, amplitude_x, damping_x);
    this.y = new Pendulum(frequency_y, phase_y, amplitude_y, damping_y);
};
SwingingBoard.prototype.project = function(point, time) { return point.add(new Vector(this.x.at(time), this.y.at(time))); }
SwingingBoard.prototype.transform = function(time, ctx) { ctx.translate(-this.x.at(time), -this.y.at(time)); }


function RotatingBoard(frequency) {
    this.frequency = frequency;
};
RotatingBoard.prototype.project = function(point, time) {
    var c = Math.cos(-time * this.frequency);
    var s = Math.sin(-time * this.frequency);
    return new Vector(c * point.x - s * point.y, s * point.x + c * point.y);
};
RotatingBoard.prototype.transform = function(time, ctx) { ctx.rotate(time * this.frequency); }

var Harmonograph = function() {
    this.points = new Array();

    var precision = 25.0;
    var damping = 0.0001 * 25 / precision;

    this.x = new Pendulum(1.0/precision, 0, 400, damping);
    this.y = new Pendulum(1.5/precision, 0, 400, damping);
    //this.board = new RotatingBoard(0.5/25);
    this.board = new SwingingBoard(1.25/precision, 1.25/precision, 0, 0, 100, 100, damping, damping);

    this.consolidate();
}

Harmonograph.prototype.consolidate = function() {
    try {
        var px = this.x.life();
        var py = this.y.life();

        this.p = Math.max(px, py);
        console.log(this.p);

        this.points.length = 0;
        for(var t = 0; t < this.p; ++t) {
            this.points.push(this.board.project(new Vector(this.x.at(t), this.y.at(t)), t));
        }
    } catch (e) {
        this.points.length = 0;
        alert("Invalid parameters");
    }
};