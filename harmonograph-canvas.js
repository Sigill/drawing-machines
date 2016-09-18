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

    var interval = (time - this.lastUpdateTime);

    if (this.animate) {
        var step = this.PPS * interval / 1000 + this.stepRemainder;
        var stepCount = Math.floor(step);
        this.stepRemainder = step - stepCount;

        this.t = Math.min(this.t + stepCount, this.points.length);
    } else {
        this.t = this.points.length;
    }

    if (this.t == this.p) { this.running = false; }

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(this.canvas.width / 2.0, this.canvas.height / 2.0)
    //this.ctx.translate(0.5, 0.5);

    this.ctx.strokeStyle = 'orangered';
    this.ctx.fillStyle = 'green';
    this.ctx.lineWidth = 1;

    var px = this.x.at(this.t);
    var py = this.y.at(this.t);

    //console.log(this.t + ": " + px);

    this.ctx.beginPath();
    this.ctx.moveTo(px + 0.5, -this.canvas.height / 2.0);
    this.ctx.lineTo(px + 0.5,  this.canvas.height / 2.0);

    this.ctx.moveTo(-this.canvas.width / 2.0, py + 0.5);
    this.ctx.lineTo( this.canvas.width / 2.0, py + 0.5);
    this.ctx.stroke()

    this.board.transform(this.t, this.ctx);

    drawPath(this.ctx, this.points, this.t);

    this.lastUpdateTime = time;

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.update.bind(this));
    }

    stats.end();
}

CanvasHarmonograph.prototype.restart = function() {
    this.t = 0;
    this.stepRemainder = 0;
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

function handleSpeedChange(value) {
    h.PPS = value;
}

function redrawCallback() {
    h.consolidate();
    h.restart();
    h.redraw();
}

gui.onAnimate(handleAnimate);
gui.onSpeedChange(handleSpeedChange);

gui.onXPendulumUpdate(redrawCallback);
gui.onYPendulumUpdate(redrawCallback);

gui.onBoardChange(redrawCallback, redrawCallback);
gui.onBoardUpdate(redrawCallback);
