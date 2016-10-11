"use strict";

var Oscillator = function(position, scale, R, r, d, period, phase1, phase2) {
    this.position = new Vector(position.x, position.y);
    this.scale = scale;
    this._R = R;
    this._r = r;
    this._d = d;
    this._period = period;
    this.phase1 = phase1;
    this.phase2 = phase2;
    this.points = new Array();

    this.consolidate();
    console.log(this.period());
};

Oscillator.prototype.consolidate = function() {
    this.R = this.scale * this._R;
    this.r = this.scale * this._r;
    this.d = this.scale * this._d;

    this.points.length = 0;
    var p = this.period();
    for (var i = 0; i <= p; ++i) {
        this.points.push(this.at(i));
    }
};

Oscillator.prototype.theta = function(t) {
    return t * 2 * Math.PI / this._period + this.phase1;
};

Oscillator.prototype.period = function() {
    if(this._r == 0) {
        return Math.abs(this._period);
    } else {
        return Math.abs(this._period) * this._r / gcd(this._R, this._r);
    }
};


function Epitrochoide(position, scale, R, r, d, period, phase1, phase2) {
    Oscillator.call(this, position, scale, R, r, d, period, phase1, phase2);
}

Epitrochoide.prototype = Object.create(Oscillator.prototype);
Epitrochoide.prototype.constructor = Epitrochoide;


Epitrochoide.prototype.at = function(t) {
    var theta = this.theta(t);
    var p = new Vector();
    p.x = (this.R + this.r) * Math.cos(theta);
    p.y = (this.R + this.r) * Math.sin(theta);

    if(this.r > 0) {
        p.x -= this.d * Math.cos(theta * (this.R + this.r) / this.r + this.phase2);
        p.y -= this.d * Math.sin(theta * (this.R + this.r) / this.r + this.phase2);
    }

    p.add(this.position);

    return p;
};

Epitrochoide.prototype.maxRadius = function() {
    if(this.r > 0) {
        return this.R + this.r + this.d;
    } else {
        return this.R;
    }
};


function Hypotrochoide(position, scale, R, r, d, period, phase1, phase2) {
  Oscillator.call(this, position, scale, R, r, d, period, phase1, phase2);
}

Hypotrochoide.prototype = Object.create(Oscillator.prototype);
Hypotrochoide.prototype.constructor = Hypotrochoide;

Hypotrochoide.prototype.at = function(t) {
    var theta = this.theta(t);
    var p = new Vector();
    p.x = (this.R - this.r) * Math.cos(theta);
    p.y = (this.R - this.r) * Math.sin(theta);

    if(this.r > 0) {
        p.x += this.d * Math.cos(theta * (this.R - this.r) / this.r + this.phase2);
        p.y -= this.d * Math.sin(theta * (this.R - this.r) / this.r + this.phase2);
    }

    p.add(this.position);

    return p;
};

Hypotrochoide.prototype.maxRadius = function() {
    if(this.r > 0) {
        return this.R - this.r + this.d;
    } else {
        return this.R;
    }
};


function SimpleArticulatedArm(l, r) {
    this.l = l;
    this.r = r;
    this.minimumSize = 0;
}

SimpleArticulatedArm.prototype.at = function(leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l, rightHandle.x, rightHandle.y, this.r);
    return intersections[0];
};

SimpleArticulatedArm.prototype.scaleToMinimumSize = function(size) {
    this.minimumSize = size;

    if(this.l + this.r >= size) {
        return;
    }

    var ratio = this.l / (this.l + this.r);

    this.l = size * ratio;
    this.r = size * (1 - ratio);
};


function Pantograph(l1, r1, l2, r2, l3, r3) {
    this.l1 = l1;
    this.r1 = r1;
    this.l2 = l2;
    this.r2 = r2;
    this.l3 = l3;
    this.r3 = r3;
}

Pantograph.prototype.at = function(leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l1, rightHandle.x, rightHandle.y, this.r1);

    var intersect = intersections[0];

    var leftArm = new Vector(intersect.x - leftHandle.x, intersect.y - leftHandle.y);
    var rightArm = new Vector(intersect.x - rightHandle.x, intersect.y - rightHandle.y);

    var leftArm2 = new Vector(leftArm.x, leftArm.y);
    var rightArm2 = new Vector(rightArm.x, rightArm.y);

    leftArm2.normalize(); leftArm2.mult(this.l2); leftArm2.add(intersect);
    rightArm2.normalize(); rightArm2.mult(this.r2); rightArm2.add(intersect);

    var intersections2 = circleIntersections(rightArm2.x, rightArm2.y, this.r3, leftArm2.x, leftArm2.y, this.l3);

    return new Vector(intersections2[0].x, intersections2[0].y);
};

Pantograph.prototype.scaleToMinimumSize = function(size) {
    this.minimumSize = size;

    if(this.l1 + this.r1 >= size) {
        return;
    }

    var ratio = this.l1 / (this.l1 + this.r1);

    this.l1 = size * ratio;
    this.r1 = size * (1-ratio);
};


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


function Pintograph(parameters) {
    this.points = new Array();

    var l = parameters['leftOscillator'];
    if (parameters['leftOscillatorType'] == 'Epitrochoide') {
        this.left  = new Epitrochoide(new Vector(l['x'], l['y']), l['scale'], l['_R'], l['_r'], l['_d'], l['_period'], l['phase1'], l['phase2']);
    } else if (parameters['leftOscillatorType'] == 'Hypotrochoide') {
        this.left  = new Hypotrochoide(new Vector(l['x'], l['y']), l['scale'], l['_R'], l['_r'], l['_d'], l['_period'], l['phase1'], l['phase2']);
    }

    var r = parameters['rightOscillator'];
    if (parameters['rightOscillatorType'] == 'Epitrochoide') {
        this.right  = new Epitrochoide(new Vector(r['x'], r['y']), r['scale'], r['_R'], r['_r'], r['_d'], r['_period'], r['phase1'], r['phase2']);
    } else if (parameters['rightOscillatorType'] == 'Hypotrochoide') {
        this.right  = new Hypotrochoide(new Vector(r['x'], r['y']), r['scale'], r['_R'], r['_r'], r['_d'], r['_period'], r['phase1'], r['phase2']);
    }

    var minimumArmLength = this.minimumArmLength();
    var a = parameters['arm'];
    if (parameters['armType'] == 'SimpleArticulatedArm') {
        if (a['l'] + a['r'] < minimumArmLength) { throw new RangeError("Minimum arm length is " + minimumArmLength); }
        this.arm = new SimpleArticulatedArm(a['l'], a['r']);
    } else if (parameters['armType'] == 'Pantograph') {
        if (a['l1'] + a['r1'] < minimumArmLength) { throw new RangeError("Minimum arm length is " + minimumArmLength); }
        this.arm = new Pantograph(a['l1'], a['r1'], a['l2'], a['r2'], a['l3'], a['r3']);
    }

    this.consolidate();
}

Pintograph.prototype.minimumArmLength = function() {
    return this.left.position.dist(this.right.position) + this.left.maxRadius() + this.right.maxRadius();
};

Pintograph.prototype.consolidate = function() {
    try {
        this.p = lcm(this.left.period(), this.right.period());
        console.log(this.p);

        this.points.length = 0;
        for(var t = 0; t <= this.p; ++t) {
            this.points.push(this.arm.at(this.left.at(t), this.right.at(t)));
        }
        return true;
    } catch (e) {
        this.points.length = 0;
        //alert("Invalid parameters");
        return false;
    }
};


function Harmonograph(parameters) {
    this.points = new Array();

    this.precision = parameters['precision'];
    this.damperType = parameters['damperType'];
    this.term = parameters['term'];

    this.x = new Pendulum(parameters['x_pendulum']['period'], parameters['x_pendulum']['phase'], parameters['x_pendulum']['amplitude'], this.damperType, this.term);
    this.y = new Pendulum(parameters['y_pendulum']['period'], parameters['y_pendulum']['phase'], parameters['y_pendulum']['amplitude'], this.damperType, this.term);

    if (parameters['boardType'] == 'Static') {
        this.board = new StaticBoard();
    } else if (parameters['boardType'] == 'Swinging') {
        this.board = new SwingingBoard(parameters['board']['period_x'], parameters['board']['period_y'],
                                       parameters['board']['phase_x'], parameters['board']['phase_y'],
                                       parameters['board']['amplitude_x'], parameters['board']['amplitude_y'],
                                       this.damperType, this.term);
    } else if (parameters['boardType'] == 'Rotating') {
        this.board = new RotatingBoard(parameters['board']['period']);
    }

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