/**
 * GameManager.js
 * @fileoverview This is the game manager for my game of GameManager. It controls the drawing, 
 * requesting AI moves, handling user movements, keeps track of the score, and sets up the game.
 * @author davidliangx27@gmail.com (David Liang)
 */

'use strict';

var ROWS = 24; // number of rows of board
var COLS = 10; // number of columns of board
var HIDDEN = 4; // number of rows hidden at the top
var INTERVAL = 300; // interval between each drop in ms
var DOWN = "d";
var LEFT = "l";
var RIGHT = "r";
var COLORS = ["#FFFFFF", "#000000", "#00FFFF", "#FFFF00", "#9900FF", "#00FF00", "#FF0000", "#0000FF", "#FFAA00"]; // colors for each type of block

/**
 * Constructor for the game manager.
 * @param minimal True if the GameManager shuould be minimal, used for the weight learning.
 */
function GameManager(minimal) {
   this.minimal = minimal;
   GameManager.setup(this);
   if (!this.minimal) {
      this.setupPage();
      this.update();
   }
}

/**
 * Set up the buttons and the references to the canvases.
 */
GameManager.prototype.setupPage = function () {
   // the canvas on which the game is displayed and the canvas on which the next piece is drawn onto
   this.canvas = document.getElementById('canvas');
   this.nextPieceCanvas = document.getElementById('next-piece-canvas');
   this.scoreContainer = document.getElementById('score-container');
   // width and height of block of each piece in pixels
   this.blockHeight = this.canvas.height / (ROWS - HIDDEN);
   this.blockWidth = this.canvas.width / (COLS);
   // set up buttons
   var _this = this;
   $('#reset-button').click(function () {
      GameManager.setup(_this);
      _this.draw();
   });
   $('#play-button').click(function () {
      _this.stopped = !_this.stopped;
      if (!_this.stopped) {
         _this.update();
      }
   });
   $('#AI-button').click(function () {
      _this.usingAI = !_this.usingAI;
   });
   $("#guiding-button").click(function () {
      _this.guiding = !_this.guiding;
      _this.draw();
   });
   window.onkeydown = function (event) {
      // prevent space bar from scrolling down the page
      if (event.keyCode == 32) {
         event.preventDefault();
      }
   };
   // add event listener for controls of the game
   document.addEventListener('keydown', function (event) {
      // while the game is not paused and not over
      if (!_this.over && !_this.usingAI) {
         switch (event.which) {
         case 32: // space: drop
            _this.dropping = true;
            break;
         case 83: // s: down
            _this.movePiece(DOWN);
            break;
         case 65: // a: left
            _this.movePiece(LEFT);
            break;
         case 68: // d: right
            _this.movePiece(RIGHT);
            break;
         case 81: // q: rotate CCW
            _this.rotatePiece('CCW');
            break;
         case 69: // e: rotate CW
            _this.rotatePiece('CW');
            break;
         }
         _this.draw();
      }
   });
}

/**
 * This function sets up the game for a GameManager object. It sets fields, generates
 * the first two pieces, creates a new board, resets the score, and sets up the AI.
 */
GameManager.setup = function (_this) {
   _this.pieceCount = 0;
   _this.over = false;
   _this.score = 0;
   _this.previousScore = -BONUS;
   _this.pieceIndex = 0;
   _this.guiding = true;
   _this.shufflePieces();
   _this.workingPiece = _this.generatePiece();
   _this.nextPiece = _this.generatePiece();
   _this.board = new Board(ROWS, COLS);
   _this.usingAI = true;
   _this.AI = new AI(_this.board, _this.workingPiece, _this.nextPiece);
   _this.previousUpdateTime = Date.now();
   window.requestAnimationFrame = function () {
      return (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 120); });
   }();
}

/**
 * This function will be recursively called to continually update the board and to pull
 * down the working piece after enough time has passed.
 * @param time The time that this funtion was called, used to calculate elapsed time.
 */
GameManager.prototype.update = function () {
   this.board.matrix = this.board.newMatrix;
   var _currentTime = Date.now();
   if (this.usingAI || this.dropping || _currentTime - this.previousUpdateTime > INTERVAL) {
      if (this.usingAI && !this.AI.moved) {
         this.AIMove();
      }
      if (!this.usingAI || this.AI.moved) {
         this.movePiece(DOWN);
      }
      this.draw();
      this.evaluateGameOver();
      this.previousUpdateTime = _currentTime;
   }
   if (!this.over && !this.stopped && !this.minimal) {
      window.requestAnimationFrame(function () {
         this.update();
      }.bind(this));
      return true;
   } else if (!this.over && !this.stopped && this.minimal) {
      return true;
   } else {
      return false;
   };
};

/**
 * 
 */
GameManager.prototype.evaluateGameOver = function () {
   this.over = this.board.evaluateGameOver();
   if (!this.minimal && this.over) {
      console.log(this.over);

      GameManager.setup(this);
   }
}

/**
 * Execute move given by the AI.
 */
GameManager.prototype.AIMove = function () {
   if (this.workingPiece.y > 0) {
      return;
   }
   this.updateAI();
   this.move = this.AI.getMove();
   this.workingPiece.col = this.move.col;
   this.workingPiece.rotation = this.move.rotation;
   this.workingPiece.rotate();
}

/**
 * Update AI's knowledge of the working and next piece.
 */
GameManager.prototype.updateAI = function () {
   this.AI.workingPiece = this.workingPiece.duplicate();
   this.AI.nextPiece = this.nextPiece.duplicate();
   this.AI.board = this.board;
}

/**
 * Shuffle pieces if needed and then generate a new piece to be used.
 * @return The next piece.
 */
GameManager.prototype.generatePiece = function () {
   this.pieceCount++;
   if (this.pieceIndex >= this.pieces.length) {
      this.shufflePieces();
      this.pieceIndex = 0;
   }
   return new Piece(this.pieces[this.pieceIndex++]);
}

/**
 * Shuffle the array that contains the order of the pieces to use.
 */
GameManager.prototype.shufflePieces = function () {
   var _ind = 0;
   this.pieces = new Array(PIECES).fill(0);
   while (_ind < PIECES) {
      var _randomInt = Math.floor(Math.random() * PIECES + 1);
      if (this.pieces.includes(_randomInt)) {
         continue;
      } else {
         this.pieces[_ind++] = _randomInt;
      }
   }
}

/**
 * Determine if a move is allowed, and execute if allowed.
 * @param direction The direction (down, left right) in which to move the working piece.
 */
GameManager.prototype.movePiece = function (direction) {
   if (this.board.moveAllowed(this.workingPiece, direction)) {
      switch (direction) {
      case DOWN:
         this.workingPiece.row++;
         break;
      case LEFT:
         this.workingPiece.col--;
         break;
      case RIGHT:
         this.workingPiece.col++;
         break;
      }
   } else if (direction == DOWN) {
      this.board.addPiece(this.workingPiece);
      this.workingPiece = this.nextPiece;
      this.nextPiece = this.generatePiece();
      if (this.dropping) {
         this.dropping = false;
      }
      this.AI.moved = false;
   }
   this.clearFilledRows();
}

/**
 * Determine if a rotation is allowed (no pieces blocking it) and execute if allowed.
 * @param direction The direction (cw or ccw) of rotation.
 */
GameManager.prototype.rotatePiece = function (direction) {
   if (this.board.rotationAllowed(this.workingPiece, direction)) {
      this.workingPiece.rotate(direction);
   }
}

/**
 * This clears all filled rows in the game.
 */
GameManager.prototype.clearFilledRows = function () {
   if (this.board.clearFilledRows() > 0) {
      this.score += 100;
   }
}

/**
 * Draws the board, working piece, next piece, and score to the screen.
 */
GameManager.prototype.draw = function () {
   if (this.minimal) {
      return;
   }
   this.board.matrix = this.board.newMatrix;
   var _board = this.board.duplicate();
   var _piece = this.workingPiece;
   _board.addPiece(_piece);
   var _gameContext = this.canvas.getContext('2d');
   _gameContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
   var _topMargin = -1;
   _gameContext.fillStyle = "#111111";
   // draw the gray guiding background
   for (var _col = 0; this.guiding && _col < _piece.matrix.length; _col++, _topMargin = -1) {
      for (var _row = 0; _row < _piece.matrix.length; _row++) {
         if (_piece.matrix[_row][_col] != FREE) {
            _topMargin = _row;
         }
      }
      if (_topMargin != -1) {
         _gameContext.fillRect(this.blockWidth * (_piece.col + _col), this.blockHeight * (_piece.row + _topMargin - HIDDEN), this.blockWidth, 10 * this.canvas.height)
      }
   }
   // draw blocks onto game canvas
   for (var _row = HIDDEN; _row < ROWS; _row++) {
      for (var _col = 0; _col < COLS; _col++) {
         if (_board.matrix[_row][_col] != FREE) {
            _gameContext.fillStyle = COLORS[_board.matrix[_row][_col] + 1];
            _gameContext.fillRect(this.blockWidth * _col, this.blockHeight * (_row - HIDDEN), this.blockWidth, this.blockHeight);
         }
      }
   }
   var _nextPieceContext = this.nextPieceCanvas.getContext('2d');
   _nextPieceContext.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
   // draw the next piece into its container
   for (var _row = 0; _row < this.nextPiece.matrix.length; _row++) {
      for (var _col = 0; _col < this.nextPiece.matrix.length; _col++) {
         if (this.nextPiece.matrix[_row][_col] != FREE) {
            _nextPieceContext.fillStyle = COLORS[this.nextPiece.matrix[_row][_col] + 1];
            _nextPieceContext.fillRect(20 * _col, 20 * _row, 20, 20);
         }
      }
   }
   this.scoreContainer.innerHTML = this.score;
}