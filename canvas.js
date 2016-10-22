"use strict";

Epitrochoide.prototype.draw = function(ctx, t) {
    var theta = this.theta(t);

    var cx = this.position.x, cy = this.position.y;

    ctx.beginPath();
        ctx.exact.arc(cx, cy, this.R, 0, 2 * Math.PI, false);

        var c  = ctx.exact.projectAndRound(cx, cy);
        ctx.moveTo(c.x - 3 * ctx.zoompan.scale    , c.y + 0.5);
        ctx.lineTo(c.x + 3 * ctx.zoompan.scale + 1, c.y + 0.5);
        ctx.moveTo(c.x + 0.5, c.y - 3 * ctx.zoompan.scale    );
        ctx.lineTo(c.x + 0.5, c.y + 3 * ctx.zoompan.scale + 1);
    ctx.stroke();


    if(this.r > 0) {
        var p = new Vector((this.R + this.r) * Math.cos(theta), (this.R + this.r) * Math.sin(theta));
        p.add(this.position);
        ctx.beginPath();
            ctx.exact.arc(p.x, p.y, this.r, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
            ctx.exact.arc(p.x, p.y, this.d, 0, 2 * Math.PI, false);
        ctx.stroke();

        var p2 = p.copy();
        p2.x -= this.d * Math.cos(theta * (this.R + this.r) / this.r + this.phase2);
        p2.y -= this.d * Math.sin(theta * (this.R + this.r) / this.r + this.phase2);
        ctx.beginPath();
            ctx.exact.moveTo(p.x, p.y);
            ctx.exact.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    var p = this.period();
    for(var i = 0; i <= p; ++i) {
        ctx.exact.dot(this.points[i].x, this.points[i].y);
    }
};

Hypotrochoide.prototype.draw = function(ctx, t) {
    var theta = this.theta(t);

    var cx = this.position.x, cy = this.position.y;

    ctx.beginPath();
        ctx.exact.arc(cx, cy, this.R, 0, 2 * Math.PI, false);

        var c  = ctx.exact.projectAndRound(cx, cy);
        ctx.moveTo(c.x - 3 * ctx.zoompan.scale    , c.y + 0.5);
        ctx.lineTo(c.x + 3 * ctx.zoompan.scale + 1, c.y + 0.5);
        ctx.moveTo(c.x + 0.5, c.y - 3 * ctx.zoompan.scale    );
        ctx.lineTo(c.x + 0.5, c.y + 3 * ctx.zoompan.scale + 1);
    ctx.stroke();

    if(this.r > 0) {
        var p = new Vector((this.R - this.r) * Math.cos(theta), (this.R - this.r) * Math.sin(theta));
        p.add(this.position);
        ctx.beginPath();
            ctx.exact.arc(p.x, p.y, this.r, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
            ctx.exact.arc(p.x, p.y, this.d, 0, 2 * Math.PI, false);
        ctx.stroke();

        var p2 = p.copy();
        p2.x += this.d * Math.cos(theta * (this.R - this.r) / this.r + this.phase2);
        p2.y -= this.d * Math.sin(theta * (this.R - this.r) / this.r + this.phase2);
        ctx.beginPath();
            ctx.exact.moveTo(p.x, p.y);
            ctx.exact.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    var p = this.period();
    for(var i = 0; i <= p; ++i) {
        ctx.exact.dot(this.points[i].x, this.points[i].y);
    }
};


SimpleArticulatedArm.prototype.draw = function(ctx, leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l, rightHandle.x, rightHandle.y, this.r);
    var intersect = intersections[0];

    ctx.beginPath();
        ctx.exact.moveTo(leftHandle.x, leftHandle.y);
        ctx.exact.lineTo(intersect.x, intersect.y);
        ctx.exact.moveTo(rightHandle.x, rightHandle.y);
        ctx.exact.lineTo(intersect.x, intersect.y);
    ctx.stroke();
};

Pantograph.prototype.draw = function(ctx, leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l1, rightHandle.x, rightHandle.y, this.r1);

    var intersect = intersections[0];

    var leftArm = new Vector(intersect.x - leftHandle.x, intersect.y - leftHandle.y);
    var rightArm = new Vector(intersect.x - rightHandle.x, intersect.y - rightHandle.y);

    ctx.beginPath();
        ctx.exact.moveTo(leftHandle.x, leftHandle.y);
        ctx.exact.lineTo(intersect.x, intersect.y);
        ctx.exact.moveTo(rightHandle.x, rightHandle.y);
        ctx.exact.lineTo(intersect.x, intersect.y);
    ctx.stroke();

    var leftArm2 = new Vector(leftArm.x, leftArm.y);
    var rightArm2 = new Vector(rightArm.x, rightArm.y);

    leftArm2.normalize(); leftArm2.mult(this.l2); leftArm2.add(intersect);
    rightArm2.normalize(); rightArm2.mult(this.r2); rightArm2.add(intersect);

    ctx.beginPath();
        ctx.exact.moveTo(intersect.x, intersect.y);
        ctx.exact.lineTo(leftArm2.x, leftArm2.y);
        ctx.exact.moveTo(intersect.x, intersect.y);
        ctx.exact.lineTo(rightArm2.x, rightArm2.y);
    ctx.stroke();

    var intersections2 = circleIntersections(rightArm2.x, rightArm2.y, this.r3, leftArm2.x, leftArm2.y, this.l3);

    ctx.beginPath();
        ctx.exact.moveTo(leftArm2.x, leftArm2.y);
        ctx.exact.lineTo(intersections2[0].x, intersections2[0].y);
        ctx.exact.moveTo(rightArm2.x, rightArm2.y);
        ctx.exact.lineTo(intersections2[0].x, intersections2[0].y);
    ctx.stroke();
};


StaticBoard.prototype.transform = function(time, ctx) {};
SwingingBoard.prototype.transform = function(time, ctx) { ctx.exact.translate(-this.x.at(time), -this.y.at(time)); };
RotatingBoard.prototype.transform = function(time, ctx) { ctx.exact.rotate(time / this.period); };


function CanvasPintograph(parameters, speed) {
    Pintograph.call(this, parameters);

    this.speed     = speed;
    this.animate   = false;
    this.running   = false;

    this.restart();

    this.updateObservable = new Observable();
}

CanvasPintograph.prototype = Object.create(Pintograph.prototype);
CanvasPintograph.prototype.constructor = Pintograph;

CanvasPintograph.prototype.draw = function(time) {
    this.updateObservable.notifyObservers('beginUpdate');

    var interval = (time - this.lastUpdateTime);

    if (this.animate) {
        var step = Math.floor(this.speed * interval / 1000);

        if (step >= 1) {
            this.lastUpdateTime = time;
            this.t = Math.min(this.t + step, this.points.length - 1);
        }
    } else {
        this.t = this.points.length - 1;
    }

    if (this.t == this.points.length - 1) { this.running = false; }

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.exact.reset();
    this.ctx.exact.translate(this.ctx.zoompan.pan.x, this.ctx.zoompan.pan.y);
    this.ctx.exact.scale(this.ctx.zoompan.scale, this.ctx.zoompan.scale);

    this.ctx.strokeStyle = 'orangered';
    this.ctx.lineWidth = 1;

    drawPath(this.ctx, this.points, this.t, true);

    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';

    this.left.draw(this.ctx, this.t);
    this.right.draw(this.ctx, this.t);
    this.arm.draw(this.ctx, this.left.at(this.t), this.right.at(this.t));

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.draw.bind(this));
    }

    this.updateObservable.notifyObservers('endUpdate');
};

CanvasPintograph.prototype.restart = function() {
    this.t = 0;
    this.lastUpdateTime = performance.now();
    this.running = false;
};

CanvasPintograph.prototype.redraw = function() {
    if (!this.animate) {
        this.draw(performance.now());
    } else if (!this.running) {
        this.running = true;
        this.draw(performance.now());
    }
};

CanvasPintograph.prototype.handleAnimate = function(value) {
    this.animate = value;
    if (value) {
        this.restart();
        this.redraw();
    } else {
        this.running = false;
    }
};


function CanvasHarmonograph(parameters, speed) {
    Harmonograph.call(this, parameters);

    this.speed     = speed;
    this.animate   = false;
    this.running   = false;

    this.restart();

    this.updateObservable = new Observable();
}

CanvasHarmonograph.prototype = Object.create(Harmonograph.prototype);
CanvasHarmonograph.prototype.constructor = Harmonograph;

CanvasHarmonograph.prototype.draw = function(time) {
    this.updateObservable.notifyObservers('beginUpdate');

    if (this.animate) {
        var interval = (time - this.lastUpdateTime);
        var pointsToDraw = Math.floor(this.speed * this.precision * interval / 1000);

        if (pointsToDraw >= 1) {
            this.lastUpdateTime = time;
            this.lastPoint = Math.min(this.lastPoint + pointsToDraw, this.points.length - 1);
        }
    } else {
        this.lastPoint = this.points.length - 1;
    }

    if (this.lastPoint == this.points.length - 1) { this.running = false; }

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.exact.reset();
    this.ctx.exact.translate(this.ctx.zoompan.scale * this.canvas.width  / 2.0 + this.ctx.zoompan.pan.x,
                             this.ctx.zoompan.scale * this.canvas.height / 2.0 + this.ctx.zoompan.pan.y);
    this.ctx.exact.scale(this.ctx.zoompan.scale, this.ctx.zoompan.scale);

    this.ctx.exact.pushMatrix();
        this.board.transform(this.lastPoint / this.precision, this.ctx);

        this.ctx.strokeStyle = 'orangered';
        this.ctx.fillStyle = 'orangered';
        this.ctx.lineWidth = 1;

        drawPath(this.ctx, this.points, this.lastPoint, false);
    this.ctx.exact.popMatrix();

    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';

    var px = this.x.at(this.lastPoint / this.precision);
    var py = this.y.at(this.lastPoint / this.precision);

    var p = this.ctx.exact.projectAndRound(px, py);

    this.ctx.beginPath();
        this.ctx.moveTo(p.x + 0.5, 0                 );
        this.ctx.lineTo(p.x + 0.5, this.canvas.height);

        this.ctx.moveTo(0                , p.y + 0.5);
        this.ctx.lineTo(this.canvas.width, p.y + 0.5);
    this.ctx.stroke();

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.draw.bind(this));
    }

    this.updateObservable.notifyObservers('endUpdate');
};

CanvasHarmonograph.prototype.restart = function() {
    this.lastPoint = 0;
    this.lastUpdateTime = performance.now();
};

CanvasHarmonograph.prototype.redraw = function() {
    if (!this.animate) {
        this.draw(performance.now());
    } else if (!this.running) {
        this.running = true;
        this.draw(performance.now());
    }
};

CanvasHarmonograph.prototype.handleAnimate = function(value) {
    this.animate = value;
    if (value) {
        this.restart();
        this.redraw();
    } else {
        this.running = false;
    }
};