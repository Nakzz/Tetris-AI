/**
 * Piece.js
 * @fileoverview This class defines a piece by its fields and its methods. Each piece definition is
 * as shown on http://tetris.wikia.com/wiki/Tetromino.
 * @author davidliangx27@gmail.com (David Liang)
 */

'use strict';

var PIECES = 7; // number of pieces

/**
 * Constructor for a piece.
 * @param id The id (1-7) that defines which Tetris piece it is.
 */
function Piece(id) {
    this.id = id;
    this.matrix;
    this.matrices;
    switch (id) {
        case 1: // I
            this.matrices = [
                [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                [
                    [0, 0, 1, 0],
                    [0, 0, 1, 0],
                    [0, 0, 1, 0],
                    [0, 0, 1, 0]
                ]
            ]
            break;
        case 2: // O
            this.matrices = [
                [
                    [2, 2],
                    [2, 2]
                ]
            ];
            break;
        case 3: // T
            this.matrices = [
                [
                    [0, 3, 0],
                    [3, 3, 3],
                    [0, 0, 0]
                ],
                [
                    [0, 3, 0],
                    [0, 3, 3],
                    [0, 3, 0]
                ],
                [
                    [0, 0, 0],
                    [3, 3, 3],
                    [0, 3, 0]
                ],
                [
                    [0, 3, 0],
                    [3, 3, 0],
                    [0, 3, 0]
                ]
            ];
            break;
        case 4: // S
            this.matrices = [
                [
                    [0, 4, 4],
                    [4, 4, 0],
                    [0, 0, 0]
                ],
                [
                    [0, 4, 0],
                    [0, 4, 4],
                    [0, 0, 4]
                ],
                [
                    [0, 0, 0],
                    [0, 4, 4],
                    [4, 4, 0]
                ],
                [
                    [4, 0, 0],
                    [4, 4, 0],
                    [0, 4, 0]
                ]
            ];
            break;
        case 5: // Z
            this.matrices = [
                [

                    [5, 5, 0],
                    [0, 5, 5],
                    [0, 0, 0]
                ],
                [
                    [0, 0, 5],
                    [0, 5, 5],
                    [0, 5, 0]
                ],
                [
                    [0, 0, 0],
                    [5, 5, 0],
                    [0, 5, 5]
                ],
                [

                    [0, 5, 0],
                    [5, 5, 0],
                    [5, 0, 0]
                ]
            ];
            break;
        case 6: // J
            this.matrices = [
                [
                    [6, 0, 0],
                    [6, 6, 6],
                    [0, 0, 0]
                ],
                [
                    [0, 6, 6],
                    [0, 6, 0],
                    [0, 6, 0]
                ],
                [
                    [0, 0, 0],
                    [6, 6, 6],
                    [0, 0, 6]

                ],
                [
                    [0, 6, 0],
                    [0, 6, 0],
                    [6, 6, 0]
                ]
            ];
            break;
        case 7: // L
            this.matrices = [
                [
                    [0, 0, 7],
                    [7, 7, 7],
                    [0, 0, 0]
                ],
                [
                    [0, 7, 0],
                    [0, 7, 0],
                    [0, 7, 7]
                ],
                [
                    [0, 0, 0],
                    [7, 7, 7],
                    [7, 0, 0]
                ],
                [
                    [7, 7, 0],
                    [0, 7, 0],
                    [0, 7, 0]
                ]
            ];
            break;
    }
    this.rotation = 0;
    this.matrix = this.matrices[this.rotation];
    this.row = 0;
    // set initial x position (top left corner) to be the middle of the game board (horizontally)
    this.col = Math.floor(-this.matrix.length / 2 + COLS / 2 + .5);
}

/**
 * Rotate a piece, assuming already that the rotation is allowed.
 * @param direction Direction (CW or CCW) of rotation.
 */
Piece.prototype.rotate = function(direction) {
    switch (direction) {
        case 'CW':
            this.rotation = (this.rotation + 1);
            break;
        case 'CCW':
            this.rotation = (this.rotation - 1 + this.matrices.length);
            break;
    }
    this.rotation %= this.matrices.length;
    this.matrix = this.matrices[this.rotation];
}

/**
 * Duplicates this piece.
 * @return duplicate The duplicate.
 */
Piece.prototype.duplicate = function() {
    var _duplicate = new Piece(this.id);
    _duplicate.matrix = new Array(this.matrix.length);
    for (var _row = 0; _row < this.matrix.length; _row++) {
        _duplicate.matrix[_row] = new Array(this.cols);
        for (var _col = 0; _col < this.matrix.length; _col++) {
            _duplicate.matrix[_row][_col] = this.matrix[_row][_col];
        }
    }
    _duplicate.rotation = this.rotation;
    _duplicate.row = this.row;
    _duplicate.col = this.col;
    return _duplicate;
}

/**
 * Used for debugging. It prints out a piece's matrix representation.
 * Example for the L piece ("_" would be shown as a space):
 * __2
 * 222
 * ___
 */
Piece.prototype.print = function() {
    // for each element in the matrix, add it to a string buffer and print it
    for (var _row = 0; _row < this.matrix.length; _row++) {
        var _str = "[";
        for (var _col = 0; _col < this.matrix.length; _col++) {
            if (this.matrix[_row][_col] == FREE) {
                _str = _str.concat("0");
            } else {
                _str = _str.concat(this.matrix[_row][_col]);
            }
            if (_col < this.matrix.length - 1) {
                _str = _str.concat(", ");
            }
        }
        _str = _str.concat("]");
        if (_row < this.matrix.length - 1) {
            _str = _str.concat(",");
        }
        console.log(_str);
    }
}