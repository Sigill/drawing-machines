"use strict";

var Vector = function(x, y) {
    this.x = x;
    this.y = y;
};

Vector.prototype.copy = function () {
    return new Vector(this.x, this.y);
};

Vector.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
};

Vector.prototype.sub = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
};

Vector.prototype.mult = function (n) {
    this.x *= n;
    this.y *= n;
    return this;
};

Vector.prototype.div = function (n) {
    this.x /= n;
    this.y /= n;
    return this;
};

Vector.prototype.magSq = function () {
    var x = this.x, y = this.y;
    return (x * x + y * y);
};

Vector.prototype.mag = function () {
    return Math.sqrt(this.magSq());
};

Vector.prototype.dist = function (other) {
    var d = other.copy().sub(this);
    return d.mag();
};

Vector.prototype.normalize = function () {
    return this.div(this.mag());
};

function gcd(a, b) {
    var r = a % b;
    while(r != 0) {
        a = b;
        b = r;
        r = a % b;
    }
    return b;
}

function lcm(a, b) {
    return (a * b) / gcd(a, b);
}

function circleIntersections(x1, y1, r1, x2, y2, r2) {
    var points = new Array();

    var dx = x1 - x2;
    var dy = y1 - y2;
    var d2 = dx * dx + dy * dy;
    var d = Math.sqrt(d2);

    if( d > r1 + r2 || d < Math.abs(r1 - r2) ) {
        // No intersect
    } else {
        var a = (r1 * r1 - r2 * r2 + d2) / (2 * d);
        var h = Math.sqrt( r1*r1 - a*a );
        var xm = x1 + a * (x2 - x1) / d;
        var ym = y1 + a * (y2 - y1) / d;

        if(d == r1 + r2) {
            points.push(new Vector(xm, ym));
        } else {
            var paX = xm + h*(y2 - y1)/d;
            var paY = ym - h*(x2 - x1)/d;
            var pbX = xm - h*(y2 - y1)/d;
            var pbY = ym + h*(x2 - x1)/d;

            points.push(new Vector(paX, paY));
            points.push(new Vector(pbX, pbY));
        }
    }

    return points;
};

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

Oscillator.prototype.maxRadius = function() {};
Oscillator.prototype.at = function(t) {};

Oscillator.prototype.period = function() {
    if(this._r == 0) {
        return Math.abs(this._period);
    } else {
        return Math.abs(this._period) * this._r / gcd(this._R, this._r);
    }
};

var Epitrochoide = function(position, scale, R, r, d, period, phase1, phase2) {
    Oscillator.call(this, position, scale, R, r, d, period, phase1, phase2);
};

Epitrochoide.prototype = Object.create(Oscillator.prototype);
Epitrochoide.prototype.constructor = Oscillator;
Epitrochoide.prototype.period = Oscillator.prototype.period;


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

var Hypotrochoide = function(position, scale, R, r, d, period, phase1, phase2) {
  Oscillator.call(this, position, scale, R, r, d, period, phase1, phase2);
};

Hypotrochoide.prototype = Object.create(Oscillator.prototype);
Hypotrochoide.prototype.constructor = Oscillator;
Hypotrochoide.prototype.period = Oscillator.prototype.period;


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

function Arm() {};

Arm.prototype.at = function(leftHandle, rightHandle) {};
Arm.prototype.scaleToMinimumSize = function(size) {};

function SimpleArticulatedArm(l, r) {
    this.l = l;
    this.r = r;
    this.minimumSize = 0;
};

SimpleArticulatedArm.prototype = Object.create(Arm.prototype);
SimpleArticulatedArm.prototype.constructor = Arm;

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
};

Pantograph.prototype = Object.create(Arm.prototype);
Pantograph.prototype.constructor = Arm;

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

function OscillatingDrawingMachine() {
    this.points = new Array();

    this.left  = new Epitrochoide(new Vector(200, 200), 10, 9, 0, 0, 100, 0, 0);
    this.right = new Hypotrochoide(new Vector(200, 600), 30, 3, 1, 2, 98, 0, 0);

    var minimumArmLength = this.minimumArmLength()
    this.arm = new Pantograph(minimumArmLength / 2 * 1.01, minimumArmLength / 2 * 1.01, 100, 100, 100, 100);

    this.consolidate();
}

OscillatingDrawingMachine.prototype.minimumArmLength = function() {
    return this.left.position.dist(this.right.position) + this.left.maxRadius() + this.right.maxRadius();
};

OscillatingDrawingMachine.prototype.consolidate = function() {
    try {
        this.p = lcm(this.left.period(), this.right.period());
        console.log(this.p);

        this.points.length = 0;
        for(var t = 0; t < this.p; ++t) {
            this.points.push(this.arm.at(this.left.at(t), this.right.at(t)));
        }
    } catch (e) {
        this.points.length = 0;
        alert("Invalid parameters");
    }
};
