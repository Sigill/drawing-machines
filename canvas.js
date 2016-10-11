"use strict";

Epitrochoide.prototype.draw = function(ctx, t) {
    var theta = this.theta(t);
    var cx = this.position.x, cy = this.position.y;
    ctx.beginPath();
    ctx.arc(cx, cy, this.R, 2 * Math.PI, false);
    ctx.moveTo(this.position.x - 3, this.position.y + 0.5);
    ctx.lineTo(this.position.x + 4, this.position.y + 0.5);
    ctx.moveTo(this.position.x + 0.5, this.position.y - 3);
    ctx.lineTo(this.position.x + 0.5, this.position.y + 4);
    ctx.stroke();


    if(this.r > 0) {
        var p = new Vector();
        p.x = (this.R + this.r) * Math.cos(theta);
        p.y = (this.R + this.r) * Math.sin(theta);
        p.add(this.position);
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.r, 2 * Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.d, 2 * Math.PI, false);
        ctx.stroke();

        var p2 = new Vector(p.x, p.y);
        p2.sub(this.position);
        p2.x -= this.d * Math.cos(theta * (this.R + this.r) / this.r + this.phase2);
        p2.y -= this.d * Math.sin(theta * (this.R + this.r) / this.r + this.phase2);
        p2.add(this.position);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    var p = this.period();
    for(var i = 0; i <= p; ++i) {
        ctx.fillRect(Math.round(this.points[i].x), Math.round(this.points[i].y), 1, 1);
    }
};

Hypotrochoide.prototype.draw = function(ctx, t) {
    var theta = this.theta(t);
    var cx = this.position.x, cy = this.position.y;
    ctx.beginPath();
    ctx.arc(cx, cy, this.R, 2 * Math.PI, false);
    ctx.moveTo(this.position.x-3, this.position.y+0.5);
    ctx.lineTo(this.position.x+4, this.position.y+0.5);
    ctx.moveTo(this.position.x+0.5, this.position.y-3);
    ctx.lineTo(this.position.x+0.5, this.position.y+4);
    ctx.stroke();


    if(this.r > 0) {
        var p = new Vector();
        p.x = (this.R - this.r) * Math.cos(theta);
        p.y = (this.R - this.r) * Math.sin(theta);
        p.add(this.position);
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.r, 2 * Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.d, 2 * Math.PI, false);
        ctx.stroke();

        var p2 = new Vector(p.x, p.y);
        p2.sub(this.position);
        p2.x += this.d * Math.cos(theta * (this.R - this.r) / this.r + this.phase2);
        p2.y -= this.d * Math.sin(theta * (this.R - this.r) / this.r + this.phase2);
        p2.add(this.position);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    var p = this.period();
    for(var i = 0; i <= p; ++i) {
        ctx.fillRect(Math.round(this.points[i].x), Math.round(this.points[i].y), 1, 1);
    }
};


SimpleArticulatedArm.prototype.draw = function(ctx, leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l, rightHandle.x, rightHandle.y, this.r);
    var intersect = intersections[0];

    ctx.beginPath();
    ctx.moveTo(leftHandle.x, leftHandle.y);
    ctx.lineTo(intersect.x, intersect.y);
    ctx.moveTo(rightHandle.x, rightHandle.y);
    ctx.lineTo(intersect.x, intersect.y);
    ctx.stroke();
};

Pantograph.prototype.draw = function(ctx, leftHandle, rightHandle) {
    var intersections = circleIntersections(leftHandle.x, leftHandle.y, this.l1, rightHandle.x, rightHandle.y, this.r1);

    var intersect = intersections[0];

    var leftArm = new Vector(intersect.x - leftHandle.x, intersect.y - leftHandle.y);
    var rightArm = new Vector(intersect.x - rightHandle.x, intersect.y - rightHandle.y);

    ctx.beginPath();
    ctx.moveTo(leftHandle.x, leftHandle.y);
    ctx.lineTo(intersect.x, intersect.y);
    ctx.moveTo(rightHandle.x, rightHandle.y);
    ctx.lineTo(intersect.x, intersect.y);
    ctx.stroke();

    var leftArm2 = new Vector(leftArm.x, leftArm.y);
    var rightArm2 = new Vector(rightArm.x, rightArm.y);

    leftArm2.normalize(); leftArm2.mult(this.l2); leftArm2.add(intersect);
    rightArm2.normalize(); rightArm2.mult(this.r2); rightArm2.add(intersect);

    ctx.beginPath();
    ctx.moveTo(intersect.x, intersect.y);
    ctx.lineTo(leftArm2.x, leftArm2.y);
    ctx.moveTo(intersect.x, intersect.y);
    ctx.lineTo(rightArm2.x, rightArm2.y);
    ctx.stroke();

    var intersections2 = circleIntersections(rightArm2.x, rightArm2.y, this.r3, leftArm2.x, leftArm2.y, this.l3);

    ctx.beginPath();
    ctx.moveTo(leftArm2.x, leftArm2.y);
    ctx.lineTo(intersections2[0].x, intersections2[0].y);
    ctx.moveTo(rightArm2.x, rightArm2.y);
    ctx.lineTo(intersections2[0].x, intersections2[0].y);
    ctx.stroke();
};

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
    //this.ctx.translate(0.5, 0.5);

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
    this.ctx.translate(this.canvas.width / 2.0, this.canvas.height / 2.0)
    //this.ctx.translate(0.5, 0.5);

    this.board.transform(this.lastPoint / this.precision, this.ctx);

    this.ctx.strokeStyle = 'orangered';
    this.ctx.fillStyle = 'orangered';
    this.ctx.lineWidth = 1;

    drawPath(this.ctx, this.points, this.lastPoint, false);

    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.translate(this.canvas.width / 2.0, this.canvas.height / 2.0)

    var px = this.x.at(this.lastPoint / this.precision);
    var py = this.y.at(this.lastPoint / this.precision);

    this.ctx.beginPath();
    this.ctx.moveTo(px + 0.5, -this.canvas.height / 2.0);
    this.ctx.lineTo(px + 0.5,  this.canvas.height / 2.0);

    this.ctx.moveTo(-this.canvas.width / 2.0, py);
    this.ctx.lineTo( this.canvas.width / 2.0, py);
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