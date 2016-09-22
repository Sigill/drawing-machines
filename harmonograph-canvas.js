"use strict";

function CanvasHarmonograph(canvasID) {
    Harmonograph.call(this);

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

CanvasHarmonograph.prototype = Object.create(Harmonograph.prototype);
CanvasHarmonograph.prototype.constructor = Harmonograph;

CanvasHarmonograph.prototype.resizeCanvas = function() {
    this.canvas.width  = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.redraw();
};

CanvasHarmonograph.prototype.update = function(time) {
    stats.begin();

    if (this.animate) {
        var interval = (time - this.lastUpdateTime);
        var pointsToDrawF = this.PPS * this.precision * interval / 1000 + this.pointCountRemainder;
        var pointsToDraw = Math.floor(pointsToDrawF);
        this.pointCountRemainder = pointsToDrawF - pointsToDraw;

        this.lastPoint = Math.min(this.lastPoint + pointsToDraw, this.points.length);

        this.lastUpdateTime = time;
    } else {
        this.lastPoint = this.points.length;
    }

    if (this.lastPoint == this.points.length) { this.running = false; }

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(this.canvas.width / 2.0, this.canvas.height / 2.0)
    //this.ctx.translate(0.5, 0.5);

    this.ctx.strokeStyle = 'orangered';
    this.ctx.fillStyle = 'green';
    this.ctx.lineWidth = 1;

    var px = this.x.at(this.lastPoint / this.precision);
    var py = this.y.at(this.lastPoint / this.precision);

    this.ctx.beginPath();
    this.ctx.moveTo(px + 0.5, -this.canvas.height / 2.0);
    this.ctx.lineTo(px + 0.5,  this.canvas.height / 2.0);

    this.ctx.moveTo(-this.canvas.width / 2.0, py + 0.5);
    this.ctx.lineTo( this.canvas.width / 2.0, py + 0.5);
    this.ctx.stroke()

    this.board.transform(this.lastPoint / this.precision, this.ctx);

    drawPath(this.ctx, this.points, this.lastPoint);

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.update.bind(this));
    }

    stats.end();
}

CanvasHarmonograph.prototype.restart = function() {
    this.lastPoint = 0;
    this.pointCountRemainder = 0;
    this.lastUpdateTime = performance.now();
};

CanvasHarmonograph.prototype.redraw = function() {
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

var h = new CanvasHarmonograph('c');

var gui = new DatGuiHarmonographGui(h);

function handleAnimate(value) {
    h.animate = value;
    if (value) {
        h.restart();
        h.redraw();
    } else {
        h.running = false;
    }
}

function redrawCallback() {
    h.configure();
    h.consolidate();
    h.restart();
    h.redraw();
}

function handleSpeedChange(value) {
    h.PPS = value;
}

function handlePrecisionChange(value) {
    h.setPrecision(value);
    redrawCallback();
}

function handleTermChange(value) {
    h.setTerm(value);
    redrawCallback();
}

function handleDamperChange(value) {
    h.setDamper(value);
    redrawCallback();
}

gui.onAnimate(handleAnimate);
gui.onSpeedChange(handleSpeedChange);
gui.onPrecisionChange(handlePrecisionChange);
gui.onDamperTypeChange(handleDamperChange);
gui.onTermChange(handleTermChange);

gui.onXPendulumUpdate(redrawCallback);
gui.onYPendulumUpdate(redrawCallback);

gui.onBoardChange(redrawCallback, redrawCallback);
gui.onBoardUpdate(redrawCallback);
