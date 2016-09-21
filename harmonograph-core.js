"use strict";

function Damper(pendulum, term) {
    this.pendulum = pendulum;
    this.term = term;
}


function LinearDamper(pendulum, term) {
    console.log("LinearDamper::constructor");
    Damper.call(this, pendulum, term);
}
LinearDamper.prototype = Object.create(Damper.prototype);
LinearDamper.prototype.constructor = LinearDamper;
LinearDamper.prototype.consolidate = function() { console.log("LinearDamper::consolidate"); };
LinearDamper.prototype.at = function(time) {
    if (time > this.term * this.pendulum.precision)
        return 0;
    else
        return 1 - time / (this.term * this.pendulum.precision);
};


function ExponentialDamper(pendulum, term) {
    console.log("ExponentialDamper::constructor");
    Damper.call(this, pendulum, term);
}
ExponentialDamper.prototype = Object.create(Damper.prototype);
ExponentialDamper.prototype.constructor = ExponentialDamper;
ExponentialDamper.prototype.consolidate = function() {
    console.log("LinearDamper::consolidate");
    var threshold = 1;
    this.damping = Math.log(Math.abs(this.pendulum.amplitude) * this.pendulum.precision / threshold) / (this.term * this.pendulum.precision);
};
ExponentialDamper.prototype.at = function(time) { return Math.exp(-this.damping * time); };


function Pendulum(period, phase, amplitude, term) {
    console.log("Pendulum::constructor");
    this.period    = period;
    this.phase     = phase;
    this.amplitude = amplitude;
    this.precision = 1.0;

    this.setDamper('Linear', term);
}

Pendulum.prototype.setDamper = function(type, term) {
    console.log("Pendulum::setDamper");

    if (type == 'Linear') {
        this.damper = new LinearDamper(this, term);
    } else if (type == 'Exponential') {
        this.damper = new ExponentialDamper(this, term);
    }
}

Pendulum.prototype.consolidate = function() {
    console.log("Pendulum::consolidate");
    this.damper.consolidate();
};

Pendulum.prototype.at = function(t) {
    /*return this.amplitude * Math.sin(t / (this.period * this.precision) + this.phase) * Math.exp(-this.damping * t / this.precision);*/

    /*if (t > this.damping * this.precision)
        return 0;
    else
        return this.amplitude * Math.sin(t / (this.period * this.precision) + this.phase) * (1-t/(this.damping * this.precision));*/

    return this.amplitude * Math.sin(t / (this.period * this.precision) + this.phase) * this.damper.at(t);
};

Pendulum.prototype.life = function() {
    // This threshold is the minimum amplitude of the pendulum
    var threshold = 1;
    //return Math.ceil(Math.log(this.amplitude * this.precision / threshold) / (this.damping / this.precision));
    return Math.floor(this.damping * this.precision);
};

function Board() {

}

function StaticBoard() {
    console.log("StaticBoard::constructor");
}
StaticBoard.prototype.setPrecision = function(value) { };
StaticBoard.prototype.setTerm = function(value) { };
StaticBoard.prototype.setDamper = function(type, term) { };
StaticBoard.prototype.consolidate = function(value) { };
StaticBoard.prototype.project = function(point, time) { return point; };
StaticBoard.prototype.transform = function(time, ctx) { };


function SwingingBoard(period_x, period_y, phase_x, phase_y, amplitude_x, amplitude_y, term) {
    console.log("SwingingBoard::constructor");
    this.x = new Pendulum(period_x, phase_x, amplitude_x, term);
    this.y = new Pendulum(period_y, phase_y, amplitude_y, term);
};
SwingingBoard.prototype.setPrecision = function(value) { this.x.precision = value; this.y.precision = value; };
SwingingBoard.prototype.setTerm = function(value) { this.x.damper.term = value; this.y.damper.term = value; };
SwingingBoard.prototype.setDamper = function(type, term) { this.x.setDamper(type, term); this.y.setDamper(type, term); };
SwingingBoard.prototype.consolidate = function() { this.x.consolidate(); this.y.consolidate(); };
SwingingBoard.prototype.project = function(point, time) { return point.add(new Vector(this.x.at(time), this.y.at(time))); };
SwingingBoard.prototype.transform = function(time, ctx) { ctx.translate(-this.x.at(time), -this.y.at(time)); }


function RotatingBoard(period) {
    console.log("RotatingBoard::constructor");
    this.period = period;
    this.precision = 1.0;
};
RotatingBoard.prototype.setPrecision = function(value) { this.precision = value; };
RotatingBoard.prototype.setTerm = function(value) { };
RotatingBoard.prototype.setDamper = function(type, term) { };
RotatingBoard.prototype.consolidate = function() { };
RotatingBoard.prototype.project = function(point, time) {
    var c = Math.cos(-time / (this.period * this.precision));
    var s = Math.sin(-time / (this.period * this.precision));
    return new Vector(c * point.x - s * point.y, s * point.x + c * point.y);
};
RotatingBoard.prototype.transform = function(time, ctx) { ctx.rotate(time / (this.period * this.precision)); }


function Harmonograph() {
    this.points = new Array();

    this.precision = 1;
    this.damperType = 'Linear';
    this.term = 10000;

    this.x = new Pendulum(25, 0, 400, this.term);
    this.y = new Pendulum(20, 0, 400, this.term);
    this.board = new SwingingBoard(10, 10, 0, 0, 100, 100, this.term);

    this.consolidate();
}

Harmonograph.prototype.setPrecision = function(value) { this.precision = value; };
Harmonograph.prototype.setDamper = function(type) { this.damperType = type; };
Harmonograph.prototype.setTerm = function(value) { this.term = value; };

Harmonograph.prototype.consolidate = function() {
    try {
        this.x.precision = this.precision;
        this.y.precision = this.precision;
        this.board.setPrecision(this.precision);

        this.x.setDamper(this.damperType, this.term);
        this.y.setDamper(this.damperType, this.term);
        this.board.setDamper(this.damperType, this.term);

        this.x.consolidate();
        this.y.consolidate();
        this.board.consolidate();

        console.log(this.term);

        this.points.length = 0;
        for(var t = 0; t < this.term * this.precision; ++t) {
            this.points.push(this.board.project(new Vector(this.x.at(t), this.y.at(t)), t));
        }
    } catch (e) {
        this.points.length = 0;
        alert("Invalid parameters");
    }
};
