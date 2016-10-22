"use strict";

function Extend(Klass, Base) {
    Klass.prototype = Object.create(Base.prototype);
    Klass.prototype.constructor = Klass;
}

// Polyfill for version of IE that does not support Object.assign().
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      // We must check against these specific cases.
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

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

function drawPath(ctx, points, upto, closeWhenComplete) {
    if (points.length == 0 || upto == 0) {
        return;
    }

    var lastPoint = Math.min(upto, points.length);

    ctx.beginPath();

    ctx.exact.moveTo(points[0].x, points[0].y);
    for(var i = 1; i <= lastPoint; ++i) {
        ctx.exact.lineTo(points[i].x, points[i].y);
    }

    if (closeWhenComplete && upto == points.length - 1) {
        ctx.closePath();
    }

    ctx.stroke();
}

function ZoomPanController(canvas, redrawCallback) {
    this.canvas = canvas;
    this.redrawCallback = redrawCallback;

    this.scaleVelocity = 0.01;

    this.minLogScale = -5;
    this.maxLogScale = 5;

    this.reset();
}

ZoomPanController.prototype.reset = function() {
    this.pan = new Vector(0, 0);
    this.last = null;
    this.logScale = 0;
    this.scale = 1;
};

ZoomPanController.prototype.startEvent = function(evt) {
    //console.log('start');
    this.last = new Vector(
        evt.offsetX || (evt.pageX - this.canvas.offsetLeft),
        evt.offsetY || (evt.pageY - this.canvas.offsetTop)
    );
};

ZoomPanController.prototype.moveEvent = function(evt) {
    if (!this.last) return;

    //console.log('move');

    var ex = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    var ey = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
    this.pan.x = this.pan.x + ex - this.last.x;
    this.pan.y =this. pan.y + ey - this.last.y;
    this.last.x = ex;
    this.last.y = ey;
    this.redrawCallback();
};

ZoomPanController.prototype.endEvent = function(evt) {
    //console.log('end');
    this.last = null;
};

ZoomPanController.prototype.zoomEvent = function(evt) {
    //console.log('zoom');
    var delta = evt.wheelDelta ? evt.wheelDelta / 40 : -evt.detail;
    this.logScale = this.logScale + delta * this.scaleVelocity;
    if (this.logScale > this.maxLogScale)
        this.logScale = maxLogScale;
    if (this.logScale < this.minLogScale)
        this.logScale = minLogScale;

    var prevScale = this.scale;
    this.scale = Math.pow(2, this.logScale);

    var ex = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    var ey = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
    var mouse = new Vector(ex, ey);
    this.pan = mouse.add(this.pan.copy().sub(mouse).mult(this.scale / prevScale));
    this.redrawCallback();
};


function ExactContext(ctx) {
    this.ctx = ctx;

    this.matrix = new Matrix();
    this.matrices = [];
}

ExactContext.prototype.reset = function() {
    this.matrix.reset();
    this.matrices.length = 0;
};

ExactContext.prototype.pushMatrix = function() {
    this.matrices.push(this.matrix.clone());
};

ExactContext.prototype.popMatrix = function() {
    this.matrix = this.matrices.pop();
};

ExactContext.prototype.translate = function(tx, ty) {
    this.matrix.translate(tx, ty);
};

ExactContext.prototype.rotate = function(angle) {
    this.matrix.rotate(angle);
};

ExactContext.prototype.scale = function(s) {
    this.matrix.scale(s, s);
};

ExactContext.prototype.project = function(x, y) {
    return this.matrix.applyToPoint(x, y);
};

ExactContext.prototype.projectAndRound = function(x, y) {
    var p = this.matrix.applyToPoint(x, y);
    var pi = new Vector(Math.round(p.x), Math.round(p.y));
    if (pi.x > p.x) { pi.x = pi.x - 1; }
    if (pi.y > p.y) { pi.y = pi.y - 1; }
    return pi;
};

ExactContext.prototype.moveTo = function(x, y, rx, ry) {
    var p = this.matrix.applyToPoint(x, y);
    this.ctx.moveTo(p.x, p.y);
};

ExactContext.prototype.lineTo = function(x, y, rx, ry) {
    var p = this.matrix.applyToPoint(x, y);
    this.ctx.lineTo(p.x, p.y);
};

ExactContext.prototype.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
    var p = this.matrix.applyToPoint(x, y);
    this.ctx.arc(p.x, p.y, radius * this.ctx.zoompan.scale, startAngle, endAngle, anticlockwise);
};

ExactContext.prototype.dot = function(x, y) {
    var p = this.projectAndRound(x, y);
    this.ctx.fillRect(p.x, p.y, 1, 1);
};