"use strict";

var Pendulum = function(period, phase, amplitude, damping) {
    this.period    = period;
    this.phase     = phase;
    this.amplitude = amplitude;
    this.damping   = damping;
    this.precision = 1.0;
};

Pendulum.prototype.at = function(t) {
    return this.amplitude * Math.sin(t / (this.period * this.precision) + this.phase) * Math.exp(-this.damping * t / this.precision)
};

Pendulum.prototype.life = function() {
    // This threshold is the minimum amplitude of the pendulum
    var threshold = 0.5;
    return Math.ceil(Math.log(this.amplitude * this.precision / threshold) / (this.damping / this.precision));
};


function StaticBoard() {}
StaticBoard.prototype.project = function(point, time) { return point; }
StaticBoard.prototype.transform = function(time, ctx) { }
StaticBoard.prototype.setPrecision = function(value) { }


function SwingingBoard(period_x, period_y, phase_x, phase_y, amplitude_x, amplitude_y, damping_x, damping_y) {
    this.x = new Pendulum(period_x, phase_x, amplitude_x, damping_x);
    this.y = new Pendulum(period_y, phase_y, amplitude_y, damping_y);
};
SwingingBoard.prototype.project = function(point, time) { return point.add(new Vector(this.x.at(time), this.y.at(time))); }
SwingingBoard.prototype.transform = function(time, ctx) { ctx.translate(-this.x.at(time), -this.y.at(time)); }
SwingingBoard.prototype.setPrecision = function(value) { this.x.precision = value; this.y.precision = value; };

function RotatingBoard(period) {
    this.period = period;
    this.precision = 1.0;
};
RotatingBoard.prototype.project = function(point, time) {
    var c = Math.cos(-time / (this.period * this.precision));
    var s = Math.sin(-time / (this.period * this.precision));
    return new Vector(c * point.x - s * point.y, s * point.x + c * point.y);
};
RotatingBoard.prototype.transform = function(time, ctx) { ctx.rotate(time / (this.period * this.precision)); }
RotatingBoard.prototype.setPrecision = function(value) { this.precision = value; };

var Harmonograph = function() {
    this.points = new Array();

    var precision = 25.0;
    var damping = 0.0001 * 25 / precision;

    this.x = new Pendulum(25, 0, 400, damping);
    this.y = new Pendulum(20, 0, 400, damping);
    this.board = new SwingingBoard(10, 10, 0, 0, 100, 100, damping, damping);

    this.consolidate();
}

Harmonograph.prototype.setPrecision = function(value) {
    this.x.precision = value;
    this.y.precision = value;
    this.board.setPrecision(value);
};

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
