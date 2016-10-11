"use strict";

function CanvasHarmonograph(canvasID) {
    Harmonograph.call(this);

    this.canvas    = document.getElementById(canvasID);
    this.container = this.canvas.parentNode;
    this.ctx       = this.canvas.getContext('2d');
    this.speed     = 120;
    this.animate   = false;
    this.running   = false;
    this.restart();

    this.updateObservable = new Observable();

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

    drawPath(this.ctx, this.points, this.lastPoint, false);

    if (this.running) {
        this.animationFrameRequest = window.requestAnimationFrame(this.update.bind(this));
    }

    this.updateObservable.notifyObservers('endUpdate');
};

CanvasHarmonograph.prototype.restart = function() {
    this.lastPoint = 0;
    this.lastUpdateTime = performance.now();
    this.running = false;
};

CanvasHarmonograph.prototype.redraw = function() {
    if (!this.animate) {
        this.update(performance.now());
    } else if (!this.running) {
        this.running = true;
        this.update(performance.now());
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

CanvasHarmonograph.prototype.redrawCallback = function() {
    this.restart();
    this.configure();
    this.consolidate();
    this.redraw();
};

CanvasHarmonograph.prototype.handlePrecisionChange = function(value) {
    this.setPrecision(value);
    this.redrawCallback();
};

CanvasHarmonograph.prototype.handleTermChange = function(value) {
    this.setTerm(value);
    this.redrawCallback();
};

CanvasHarmonograph.prototype.handleDamperChange = function(value) {
    this.setDamper(value);
    this.redrawCallback();
};
