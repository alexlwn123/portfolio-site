import React, {Component} from "react";
import Sketch from "react-p5";


class SortingSketch extends Component {
  values = [];
  Algs = ["bubbleSort", "selectionSort"];
  currentAlg = "Please Select an Algorithm";
  completed = false;
  currLine;
  moveCount = 0;
  comparisons = 0;
  i = 0;
  j = 0;
  width;
  height;
  p5;
  canvasParentRef;

  setup = (p5, canvasParentRef) => {
    this.p5 = p5;
    this.canvasParentRef = canvasParentRef;
    p5.createCanvas(600, 400).parent(canvasParentRef);
    this.width = 600;
    this.height = 400;
    console.log(this.width)
    this.values = new Array(this.width/4);
    this.navBar();
    p5.frameRate(20)
    for (let i = 0; i < this.width/4; i++){ 
      this.values[i] = Math.floor(Math.random()*this.height);
    }
  };

  selectionSort = () => {
    if (this.i === this.values.length) {
      this.finished();
      return;
    }
    let minind = -1;
    for (let j = this.values.length-1; j >= this.i; j--) {
      this.comparisons++;
      if (minind === -1 || this.values[j] > this.values[minind]) {
        minind = j;
      }
    }
    this.moveCount++;
    this.currLine = minind; 
    let temp = this.values[minind];
    this.values[minind] = this.values[this.i];
    this.values[this.i] = temp;
    this.i++;

  }

  insertionSort = () => {
    if (this.i === this.values.length-1) {
      this.finished();
      return;
    }
    let next = this.values[this.i+1];
    for (let j = 0; j < this.i+1; j++) {
      this.comparisons++;
      if (this.values[j] < next) {
        this.currLine = j;
        for(let k = this.i; k > j-1; k--) {
          this.values[k+1] = this.values[k];
          this.moveCount++;
        }
        this.values[j] = next;
        this.moveCount++;
        break;
      }
    }  
    this.i++;
  }


  bubbleSort = () => {
    if (this.i === this.values.length) {
      this.finished(); 
      return;
    }
    for (let j = 0; j < this.values.length-this.i-1; j++) {
      this.comparisons++;
      this.currLine = j+1;
      if (this.values[j] < this.values[j+1]) {
        this.moveCount++;
        let temp = this.values[j];
        this.values[j] = this.values[j+1];
        this.values[j+1] = temp;
      }
    }
    this.i++;
  }

  finished = () =>{
    this.currLine = -1
    this.drawLines();
    this.i=0;
    this.p5.noLoop();
  }

  update = () => {
    if (this.currentAlg === "bubbleSort") this.bubbleSort();
    else if (this.currentAlg === "selectionSort") this.selectionSort();
    else if (this.currentAlg === "insertionSort") this.insertionSort();
  }

  resetBoard = () => {
    this.p5.loop();
    for (let i = 0; i < this.width/4; i++){ 
      this.values[i] = Math.floor(Math.random() * this.height);
    }
    this.i = 0;
    this.p5.noLoop();
    this.moveCount = 0;
    this.comparisons = 0;
  }

  setAlg = (nextAlg) => {
    console.log(nextAlg);
    if (!this.Algs.includes(nextAlg)) {
      console.log("ERROR, Does not support " + nextAlg);
    } else {
      this.resetBoard();
      this.currentAlg = nextAlg;
      this.p5.loop();
      this.update();
    }
  }

  navBar = () => {
    const yoffset = this.height+83;
    this.p5.stroke(200);
    let res = this.p5.createButton("Reset").parent(this.canvasParentRef);
    res.size(50,50);
    res.position(0, yoffset, 200);
    res.mousePressed(() => {this.resetBoard(); this.comparisons=0; this.moveCount=0;});

    let stop = this.p5.createButton("Stop").parent(this.canvasParentRef);
    stop.size(50,50);
    stop.position(50, yoffset, 200);
    stop.mousePressed(() => {this.p5.noLoop()});

    let start = this.p5.createButton("Start").parent(this.canvasParentRef);
    start.size(50,50);
    start.position(100, yoffset, 200);
    start.mousePressed(() => {this.p5.loop()});

    let bubble = this.p5.createButton("bubbleSort").parent(this.canvasParentRef);
    bubble.size(100,50);
    bubble.position(150, yoffset, 200);
    bubble.mousePressed(() => {
      this.currentAlg = "bubbleSort";
      this.resetBoard();
    });

    let selection = this.p5.createButton("selectionSort").parent(this.canvasParentRef);
    selection.size(100,50);
    selection.position(250, yoffset, 200);
    selection.mousePressed(() => {
      this.currentAlg = "selectionSort";
      this.resetBoard();
    });

    let insertion = this.p5.createButton("insertionSort").parent(this.canvasParentRef);
    insertion.size(100,50);
    insertion.position(350, yoffset, 200);
    insertion.mousePressed(() => {
      this.currentAlg = "insertionSort";
      this.resetBoard();
    });

  }

  draw = p5 => {
    p5.background(0);
    this.drawLines();
    p5.stroke(0);
    let squarecolor = p5.color(0);
    squarecolor.setAlpha(200);
    p5.fill(squarecolor);
    p5.rect(this.width-130, 0, 150, 120);
    p5.fill(200);
    p5.textSize(16);
    p5.text(this.currentAlg, this.width-120, 70, 90, 50);
    p5.textSize(14);
    p5.text("Comparisons: " + this.comparisons, this.width-120, 50, 150, 50);
    p5.text("Moves: " + this.moveCount, this.width-120, 30, 90, 50);
    p5.text("Items: " + this.values.length, this.width-120, 10, 90, 50);
    this.update();
  }

  drawLines = () => { 
    this.p5.stroke(255);
    this.p5.strokeWeight(2);
    for (let i = 0; i < this.values.length; i++) {
      if (Math.abs(i-this.currLine) <=0 ) this.p5.stroke(100);
      this.p5.line(4*i, this.height, 4*i, this.height - this.values[i]);
      if (Math.abs(i-this.currLine) <=0 ) this.p5.stroke(255);
    }
  }

  render() {
    return (
      <div>
        <h1>Sorting Visualizer</h1>
        <Sketch setup={this.setup} draw={this.draw} />
      </div>
    )
  }




}

export default SortingSketch;

