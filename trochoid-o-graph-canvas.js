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

function CanvasOscillatingDrawingMachine(canvasID) {
    OscillatingDrawingMachine.call(this);

    this.canvas    = document.getElementById(canvasID);
    this.container = this.canvas.parentNode;
    this.ctx       = this.canvas.getContext('2d');
    this.PPS       = 120;
    this.animate   = false;
    this.running   = false;
    this.restart();

    window.addEventListener('resize', this.resizeCanvas.bind(this), false);

    this.resizeCanvas();
}

CanvasOscillatingDrawingMachine.prototype = Object.create(OscillatingDrawingMachine.prototype);
CanvasOscillatingDrawingMachine.prototype.constructor = OscillatingDrawingMachine;

CanvasOscillatingDrawingMachine.prototype.resizeCanvas = function() {
    this.canvas.width  = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.redraw();
};

CanvasOscillatingDrawingMachine.prototype.update = function(time) {
    stats.begin();

    var interval = (time - this.lastUpdateTime);

    if (this.animate) {
        var step = this.PPS * interval / 1000 + this.stepRemainder;
        var stepCount = Math.floor(step);
        this.stepRemainder = step - stepCount;

        this.t = Math.min(this.t + stepCount, this.points.length - 1);
    } else {
        this.t = this.points.length - 1;
    }

    if (this.t == this.points.length - 1) { this.running = false; }

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //this.ctx.translate(0.5, 0.5);

    this.ctx.strokeStyle = 'orangered';
    this.ctx.fillStyle = 'green';
    this.ctx.lineWidth = 1;

    this.left.draw(this.ctx, this.t);
    this.right.draw(this.ctx, this.t);
    this.arm.draw(this.ctx, this.left.at(this.t), this.right.at(this.t));

    drawPath(this.ctx, this.points, this.t, true);

    this.lastUpdateTime = time;

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.update.bind(this));
    }

    stats.end();
}

CanvasOscillatingDrawingMachine.prototype.restart = function() {
    this.t = 0;
    this.stepRemainder = 0;
    this.lastUpdateTime = performance.now();
};

CanvasOscillatingDrawingMachine.prototype.redraw = function() {
    if (!this.animate) {
        this.update(performance.now());
    } else if (!this.running) {
        this.running = true;
        this.update(performance.now());
    }
};

var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.bottom = '0px';
document.body.appendChild( stats.domElement );

var g = new CanvasOscillatingDrawingMachine('c');

var gui = new DatGuiOscillatingDrawingMachineGui(g);

function handleArmUpdate() {
    g.consolidate();
    g.restart();
    g.redraw();
}

function handleLeftOscillatorUpdate(v) {
    g.left.consolidate();
    g.consolidate();
    g.restart();
    g.redraw();
}

function handleRightOscillatorUpdate(v) {
    g.right.consolidate();
    g.consolidate();
    g.restart();
    g.redraw();
}

function handleanimate(value) {
    g.animate = value;
    if (value) {
        g.restart();
        g.redraw();
    } else {
        g.running = false;
    }
}

gui.onAnimate(handleanimate);

function redrawCallback() {
    g.consolidate();
    g.restart();
    g.redraw();
}

gui.onArmUpdate(handleArmUpdate);
gui.onLeftOscillatorUpdate(handleLeftOscillatorUpdate);
gui.onRightOscillatorUpdate(handleRightOscillatorUpdate);

gui.onArmChange(handleArmUpdate, redrawCallback);
gui.onLeftOscillatorChange(handleLeftOscillatorUpdate, redrawCallback);
gui.onRightOscillatorChange(handleRightOscillatorUpdate, redrawCallback);
