/**
 * Board.js
 * @fileoverview This class defines the board that holds the fixed and moving pieces.
 * @author davidliangx27@gmail.com (David Liang)
 */

'use strict';

var FREE = 0; // enum for a free block
var CLEAR = -1; // enum for a block  to be cleared
var BONUS = 100; // points for CLEAR a row

/**
 * Constructor for a board. Initializes matrices and saves parameters.
 * @param rows The number of rows to be used in the board.
 * @param cols The number of columns to be used in the board.
 */
function Board(rows, cols) {
   this.rows = rows;
   this.cols = cols;
   this.matrix = new Array(this.rows);
   this.newMatrix = new Array(this.rows);
   for (var _row = 0; _row < this.rows; _row++) {
      this.matrix[_row] = new Array(this.cols).fill(0);
      this.newMatrix[_row] = new Array(this.cols).fill(0);
   }
}

/**
 * Determines if the given piece is allowed to make a particular move.
 * @param piece The piece to be moved.
 * @param direction The direction in which the piece is to be moved.
 * @return allowed True if the move is legal, false elsewise.
 */
Board.prototype.moveAllowed = function (piece, direction) {
   switch (direction) {
   case DOWN:
      for (var _row = 0; _row < piece.matrix.length; _row++) {
         for (var _col = 0; _col < piece.matrix.length; _col++) {
            if (piece.matrix[_row][_col] != FREE) {
               if (piece.row + _row + 1 >= ROWS) {
                  return false;
               } else if (this.matrix[piece.row + _row + 1][piece.col + _col] > FREE) {
                  return false;
               }
            }
         }
      }
      break;
   case LEFT:
      for (var _row = 0; _row < piece.matrix.length; _row++) {
         for (var _col = 0; _col < piece.matrix.length; _col++) {
            if (piece.matrix[_row][_col] != FREE) {
               if (piece.col + _col - 1 < 0) {
                  return false;
               } else if (this.matrix[piece.row + _row][piece.col + _col - 1] > FREE) {
                  return false;
               }
            }
         }
      }
      break;
   case RIGHT:
      for (var _row = 0; _row < piece.matrix.length; _row++) {
         for (var _col = 0; _col < piece.matrix.length; _col++) {
            if (piece.matrix[_row][_col] != FREE) {
               if (piece.col + _col + 1 >= COLS) {
                  return false;
               } else if (this.matrix[piece.row + _row][piece.col + _col + 1] > FREE) {
                  return false;
               }
            }
         }
      }
      break;
   }
   return true;
}

/**
 * Determines if the given piece is allowed to make a particular rotation.
 * @param piece The piece to be rotated.
 * @param direction The direction in which the piece is to be rotated.
 * @return allowed True if the rotation is allowed, false elsewise.
 */
Board.prototype.rotationAllowed = function (piece, direction) {
   var _col = piece.col;
   var _row = piece.row;
   var _duplicate = piece.duplicate();
   _duplicate.rotate(direction);
   for (var _row = 0; _row < _duplicate.matrix.length; _row++) {
      for (var _col = 0; _col < _duplicate.matrix.length; _col++) {
         if (_duplicate.matrix[_row][_col] != FREE) {
            if (_duplicate.col + _col >= COLS) {
               return false;
            } else if (_duplicate.col + _col < 0) {
               return false;
            } else if (_duplicate.row + _row < 0) {
               return false;
            } else if (_duplicate.row + _row >= ROWS) {
               return false;
            } else if (this.matrix[_duplicate.row + _row][_duplicate.col + _col] != FREE) {
               return false;
            }
         }
      }
   }
   return true;
}

Board.prototype.evaluateGameOver = function () {
   for (var _row = 0; _row < COLS; _row++) {
      if (this.matrix[HIDDEN][_row] > FREE) {
         return true;
      }
   }
   return false;
}

/**
 * Creates a _duplicate of this board.
 * @return newBoard The _duplicate of this board.
 */
Board.prototype.duplicate = function () {
   var newBoard = new Board(this.rows, this.cols);
   for (var _row = 0; _row < newBoard.rows; _row++) {
      for (var _col = 0; _col < newBoard.cols; _col++) {
         newBoard.matrix[_row][_col] = this.matrix[_row][_col];
      }
   }
   return newBoard;
}

/**
 * Add's a piece onto this board. Used when a piece is locked in (can't move down) or
 * when drawing the piece onto the canvas.
 * @param piece The piece to be added onto this board.
 */
Board.prototype.addPiece = function (piece) {
   for (var _row = 0; _row < piece.matrix.length; _row++) {
      for (var _col = 0; _col < piece.matrix.length; _col++) {
         if (piece.matrix[_row][_col] != FREE && piece.row + _row < ROWS && piece.col + _col < COLS && piece.row + _row >= 0) {
            this.matrix[piece.row + _row][piece.col + _col] = piece.matrix[_row][_col];
         }
      }
   }
}

/**
 * Searches for a row to clear and then clears it by pulling down all the rows above it.
 * @return points Points awarded if a row is cleared.
 */
Board.prototype.clearFilledRows = function () {
   // look for a row that is marked for CLEAR
   for (var _row = ROWS - 1; _row >= 0; _row--) {
      if (this.matrix[_row][0] == CLEAR) {
         // move all rows above this down one row
         for (var _col = _row; _col > 0; _col--) {
            this.matrix[_col] = this.matrix[_col - 1];
         }
         return BONUS;
      }
   }
   this.newMatrix = this.duplicateMatrix();
   for (var _row = ROWS - 1; _row >= 0; _row--) {
      var _clearRow = true;
      for (var _col = 0; _col < COLS; _col++) {
         // stop searching this row if a free block is found in it
         if (this.matrix[_row][_col] == FREE) {
            _clearRow = false;
            _col = COLS + 1;
         }
      }
      if (_clearRow) {
         for (var _col = 0; _col < COLS; _col++) {
            this.newMatrix[_row][_col] = CLEAR;
         }
      }
   }
   return 0;
}

/**
 * Print out a string representation of the board.
 * Example ("_" would be shown as " "):
 *__________
 *____55____
 *_____55___
 *______7___
 *____777___
 *____6_____
 *____666___
 *_____44___
 *____44____
 *___1111___
 *____22____
 *____227___
 *____777___
 *_____3____
 *____333___
 *____55____
 *_____55___
 *___1111___
 *____6_____
 *____666___
 *____22____
 *____22____
 */
Board.prototype.print = function () {
   for (var _row = 0; _row < this.rows; _row++) {
      var _str = "";
      for (var _col = 0; _col < this.cols; _col++) {
         if (this.matrix[_row][_col] == FREE) {
            _str = _str.concat(" ");
         } else {
            _str = _str.concat(this.matrix[_row][_col]);
         }
      }
      console.log(_str);
   }
}

Board.prototype.duplicateMatrix = function () {
   var _duplicate = new Array(this.rows);
   for (var _row = 0; _row < this.rows; _row++) {
      _duplicate[_row] = new Array(this.cols);
      for (var _col = 0; _col < this.cols; _col++) {
         _duplicate[_row][_col] = this.matrix[_row][_col];
      }
   }
   return _duplicate;
}