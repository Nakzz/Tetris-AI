/**
 * @fileoverview This class defines the AI for which this project was created.
 * @author davidliangx27@gmail.com (David Liang)
 */

'use strict';

// indices of the AI.prototype.stats matrix e.g. the HOLES stat is in AI.prototype.stat[HOLES]
var HOLES = 0;
var JAGGED = 1;
var FILLED = 2;
var HEIGHT = 3;
var STATISTICS = 4; // the total weighted SBE is stored at STATISTICS, which is also the number of statistics
var NEGATIVES = [HOLES, JAGGED, HEIGHT]; // these are the stats that should have negative weights

/**
 * Constructor for the AI.
 * @param board The board that the AI is manipulating.
 * @param workingPiece The current piece that the AI is working with.
 * @param nextPiece The next piece that the AI will work with after the current piece.
 * @param randomize True if the weights shoudl be randomized
 */
function AI(board, workingPiece, nextPiece) {
   // save parameters and initialize variables
   this.board = board;
   this.workingPiece = workingPiece;
   this.nextPiece = nextPiece;
   this.weights = [-0.9699411317621118, -0.11608888863398259, 0.951499783994008, -0.4320928025669635];
}

/**
 * This method calculates the best move based on the current board and the current working piece.
 * and returns the best translation and rotation of the piece.
 * @return col Column of the placement of the piece that yields the highest SBE.
 * @return rotation Rotation of the best  that yields the highest SBE.
 */
AI.prototype.getMove = function () {
   this.bestSBE = -Infinity;
   var _workingPiece = this.workingPiece.duplicate();
   // test each rotation
   for (var _rotation = 0; _rotation < _workingPiece.matrices.length; _rotation++, _workingPiece.col = 0, _workingPiece.row = 0) {
      // shift piece as far left as possible
      while (this.board.moveAllowed(_workingPiece, LEFT)) {
         _workingPiece.col--;
      }
      
      // test the piece at all locations along the bottom
      for (var _col = 0; _col < COLS - _workingPiece.matrix.length + 2; _col++) {
         var _board = this.board.duplicate();
         // drop piece
         while (_board.moveAllowed(_workingPiece, DOWN)) {
            _workingPiece.row++;
         }

         _board.addPiece(_workingPiece);
         var _SBE = this.calculateSBE(_board);
         _board.clearFilledRows();

         // _SBE += this.moveHelper(_board.duplicate());

         if (_SBE > this.bestSBE) {
            this.bestSBE = _SBE;
            this.bestRotation = _workingPiece.rotation;
            this.bestCol = _workingPiece.col;
         }

         _workingPiece.row = 0;

         if (_board.moveAllowed(_workingPiece, RIGHT)) {
            _workingPiece.col++;
         } else {
            _col = COLS;
         }
      }
      _workingPiece.rotate('CW');
   }

   this.moved = true;

   return ({ col: this.bestCol, rotation: this.bestRotation })
};

/**
 * This method calculates the best move based on the current board and the next piece.
 * and returns the score.
 * @return bestSBE Best possible SBE after the move taken by the function's caller.
 */
AI.prototype.moveHelper = function (board) {
   var _bestSBE = -Infinity;
   var _workingPiece = this.nextPiece.duplicate();

   // test each rotation
   for (var _rotation = 0; _rotation < _workingPiece.matrices.length; _rotation++, _workingPiece.col = 0, _workingPiece.row = 0) {

      // shift piece as far left as possible
      while (board.moveAllowed(_workingPiece, LEFT)) {
         _workingPiece.col--;
      }

      // test the piece at all locations along the bottom
      for (var _col = 0; _col < COLS - _workingPiece.matrix.length + 2; _col++) {
         var _board = board.duplicate();

         while (_board.moveAllowed(_workingPiece, DOWN)) {
            _workingPiece.row++;
         }

         _board.addPiece(_workingPiece);
         var _SBE = this.calculateSBE(_board);
         _board.clearFilledRows();

         if (_SBE[STATISTICS] > _bestSBE) {
            _bestSBE = _SBE[STATISTICS];
         }

         _workingPiece.row = 0;

         if (_board.moveAllowed(_workingPiece, RIGHT)) {
            _workingPiece.col++;
         } else {
            _col = 2 * COLS;
         }
      }

      _workingPiece.rotate('CW');
   }

   return _bestSBE;
};

/**
 * Calculates a static board evaluation (SBE) which is basically a weighted sore based on a number
 * of statistics.
 * @param board Board for which the SBE is to be calculated.
 * @return SBE The score of the board.
 */
AI.prototype.calculateSBE = function (board) {
   if (board.evaluateGameOver()) {
      return -Infinity;
   }

   var _stats = AI.collectStatistics(board);
   var _SBE = 0;

   for (var _stat = 0; _stat < STATISTICS - 1; _stat++) {
      _SBE += _stats[_stat] * this.weights[_stat];
   }

   return _SBE;
};

/**
 * Gathers the statistics (height, jaggedness, holes, filled rows) for a given board.
 * @param board Board for which the statistics are to be collected.
 * @return stats The statistics array.
 */
AI.collectStatistics = function (board) {
   var _heights = new Array(COLS).fill(0);
   var _stats = new Array(STATISTICS + 1).fill(0);
   // calculate jaggedness, heights and holes
   for (var _col = 0; _col < COLS; _col++) {
      _heights[_col] = 0;
      var _emptyCount = 0;
      var _holeCount = 0;
      for (var _row = ROWS - 1; _row >= 0; _row--) {
         if (board.matrix[_row][_col] != FREE) {
            _heights[_col] = ROWS - _row - 1;
            _holeCount = _emptyCount;
         } else {
            _emptyCount++;
         }
      }

      _stats[HOLES] += _holeCount;

      if (_col > 0) {
         _stats[JAGGED] += Math.abs(_heights[_col] - _heights[_col - 1]);
      }
      _stats[HEIGHT] += _heights[_col];
   }

   // count filled rows
   for (var _row = ROWS - 1; _row >= 0; _row--) {
      var _filledRow = true;

      for (var _col = 0; _col < COLS; _col++) {
         // stop searching this row if its not totally filled
         if (board.matrix[_row][_col] == FREE) {
            _filledRow = false;
            _col = COLS + 1;
         }
      }

      if (_filledRow) {
         _stats[FILLED]++;;
      }
   }

   return _stats;
};