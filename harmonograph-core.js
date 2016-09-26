"use strict";


function LinearDamper(pendulum, term) {
    console.log("LinearDamper::constructor");
    this.term = term;
}

LinearDamper.prototype.at = function(time) {
    return (time > this.term) ? 0 : (1 - time / this.term);
};


function ExponentialDamper(pendulum, term) {
    console.log("ExponentialDamper::constructor");
    var threshold = 1;
    this.damping = Math.log(Math.abs(pendulum.amplitude) / threshold) / term;
}
ExponentialDamper.prototype.at = function(time) { return Math.exp(-this.damping * time); };


function Pendulum(period, phase, amplitude, damperType, term) {
    console.log("Pendulum::constructor");
    this.period    = period;
    this.phase     = phase;
    this.amplitude = amplitude;

    this.setDamper(damperType, term);
}

Pendulum.prototype.setDamper = function(type, term) {
    console.log("Pendulum::setDamper");

    if (type == 'Linear') {
        this.damper = new LinearDamper(this, term);
    } else if (type == 'Exponential') {
        this.damper = new ExponentialDamper(this, term);
    }
}

Pendulum.prototype.configure = function(damperType, term) {
    console.log("Pendulum::configure");
    this.setDamper(damperType, term);
};

Pendulum.prototype.at = function(t) {
    return this.amplitude * Math.sin(t / this.period + this.phase) * this.damper.at(t);
};

function StaticBoard() {
    console.log("StaticBoard::constructor");
}
StaticBoard.prototype.configure = function(damperType, term) {};
StaticBoard.prototype.project = function(point, time) { return point; };
StaticBoard.prototype.transform = function(time, ctx) {};


function SwingingBoard(period_x, period_y, phase_x, phase_y, amplitude_x, amplitude_y, damperType, term) {
    console.log("SwingingBoard::constructor");
    this.x = new Pendulum(period_x, phase_x, amplitude_x, damperType, term);
    this.y = new Pendulum(period_y, phase_y, amplitude_y, damperType, term);
};
SwingingBoard.prototype.configure = function(damperType, term) {
    this.x.configure(damperType, term);
    this.y.configure(damperType, term);
};
SwingingBoard.prototype.project = function(point, time) { return point.add(new Vector(this.x.at(time), this.y.at(time))); };
SwingingBoard.prototype.transform = function(time, ctx) { ctx.translate(-this.x.at(time), -this.y.at(time)); }


function RotatingBoard(period) {
    console.log("RotatingBoard::constructor");
    this.period = period;
};
RotatingBoard.prototype.configure = function(damperType, term) {};
RotatingBoard.prototype.project = function(point, time) {
    var c = Math.cos(-time / this.period);
    var s = Math.sin(-time / this.period);
    return new Vector(c * point.x - s * point.y, s * point.x + c * point.y);
};
RotatingBoard.prototype.transform = function(time, ctx) { ctx.rotate(time / this.period); }


function Harmonograph() {
    this.points = new Array();

    this.precision = 1;
    this.damperType = 'Linear';
    this.term = 10000;

    this.x = new Pendulum(25, 0, 400, this.damperType, this.term);
    this.y = new Pendulum(20, 0, 400, this.damperType, this.term);
    this.board = new SwingingBoard(10, 10, 0, 0, 100, 100, this.damperType, this.term);

    this.consolidate();
}

Harmonograph.prototype.setPrecision = function(value) { this.precision = value; };
Harmonograph.prototype.setDamper = function(type) { this.damperType = type; };
Harmonograph.prototype.setTerm = function(value) { this.term = value; };

Harmonograph.prototype.setBoard = function(boardType) {
    if(boardType == 'Static') {
        this.board = new StaticBoard();
    } else if(boardType == 'Rotating') {
        this.board = new RotatingBoard(10);
    } else if(boardType == 'Swinging') {
        this.board = new SwingingBoard(10, 10, 0, 0, 100, 100, this.damperType, this.term);
    }
};

Harmonograph.prototype.configure = function() {
    this.x.configure(this.damperType, this.term);
    this.y.configure(this.damperType, this.term);
    this.board.configure(this.damperType, this.term);
};

Harmonograph.prototype.consolidate = function() {
    try {
        console.log(this.term);

        this.points.length = 0;

        var lastPoint = Math.floor(this.term * this.precision);
        for(var i = 0; i <= lastPoint; ++i) {
            var t = i / this.precision;
            this.points.push(this.board.project(new Vector(this.x.at(t), this.y.at(t)), t));
        }
    } catch (e) {
        this.points.length = 0;
        alert("Invalid parameters");
    }
};
