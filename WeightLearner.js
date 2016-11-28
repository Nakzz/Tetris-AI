/**
 * WeightLearner.js
 * @fileoverview This class learns the weights for the stats used by the AI.
 * @author davidliangx27@gmail.com (David Liang)
 */

'use strict';

var EPOCHS = 12; // number of training periods
var POPULATION_SIZE = 960;
var ITERATIONS = 48; // number of games played per _ind
var MAX_TIME = 48000; // max time allowed for one game
var RUN = true;
var BOTTOM = .8;
var NEW = 480;

/**
 * Constructer for a WeightLearner. It initializes a game manager and then learns the weights for 
 * its AI.
 */
function WeightLearner() {
    this.game = new GameManager(true);
    this.learnWeights();
}

WeightLearner.prototype.learnWeights = function() {
    this.population = new Array(POPULATION_SIZE);
    for (var _ind = 0; _ind < POPULATION_SIZE; _ind++) {
        this.population[_ind] = { weights: WeightLearner.newWeights(), fitness: 0, probability: 0 };
    }
    this.best = this.population[0];
    // run multiple training epochs
    for (var _epoch = 0; _epoch < EPOCHS; _epoch++) {
        var _totalFitness = 0;
        // get fitness scores of each individual
        for (var _ind = 0; _ind < this.population.length; _ind++) {
            this.population[_ind].fitness = 0;
            this.game.AI.weights = this.population[_ind].weights;
            for (var _iteration = 0; RUN && _iteration < ITERATIONS; _iteration++) {
                WeightLearner.reset(this.game);
                var _startTime = Date.now();
                while (this.game.update() && Date.now() - _startTime < MAX_TIME) {; }
                this.game.stopped = true;
                this.population[_ind].fitness += this.game.score;
            }
            this.population[_ind].fitness = this.population[_ind].fitness / BONUS / ITERATIONS;
            if (this.population[_ind].fitness > this.best.fitness) {
                this.best = { weights: this.population[_ind].weights, fitness: this.population[_ind].fitness, probability: 0 };
                console.log("\nNEW BEST!!");
            }
            console.log(this.best.weights);
            console.log([this.best.fitness, _ind]);
            _totalFitness += this.population[_ind].fitness;
        }
        var _totalProbability = 0;
        this.population.sort(WeightLearner.comparator);
        for (var _ind = 0; _ind < POPULATION_SIZE; _ind++) {
            var proportionalFitness = this.population[_ind].fitness / _totalFitness;
            this.population[_ind].probability = _totalProbability + proportionalFitness;
            _totalProbability = this.population[_ind].probability;
        }
        this.population[this.population.length] = WeightLearner.copy(this.best);
        this.population[this.population.length - 1].probability = 1;
        var _population = [];
        var _ind = -1;
        // keep the best individuals of the population
        for (var _copy = this.population.length - 1; _copy > this.population.length * BOTTOM; _copy--) {
            _population[++_ind] = this.population[_copy];
            if (Math.random() > .95) {
                WeightLearner.mutate(_population[_ind]);
            }
        }
        while (_ind < POPULATION_SIZE - NEW) {
            var _prob1 = Math.random();
            var _prob2 = Math.random();
            var _parent1;
            var _parent2;
            for (var _search = 0; _search < this.population.length - 1 && !(_parent1 && _parent2); _search++) {
                if ((_prob1 >= this.population[_search].probability) && (_prob1 < this.population[_search + 1].probability)) {
                    _parent1 = WeightLearner.copy(this.population[_search]);
                }
                if ((_prob2 >= this.population[_search].probability) && (_prob2 < this.population[_search + 1].probability)) {
                    _parent2 = WeightLearner.copy(this.population[_search]);
                }
            }
            _population[++_ind] = { weights: WeightLearner.crossover(_parent1, _parent2), fitness: 0, probability: 0 };
            if (Math.random() > .95) {
                WeightLearner.mutate(_population[_ind]);
            }
        }
        while (_ind < POPULATION_SIZE) {
            _population[++_ind] = { weights: WeightLearner.newWeights(), fitness: 0, probability: 0 };
        }
        this.population = _population;
        console.log("EPOCH FINISHED");
    }
    RUN = false;
    console.log("DONE")
}

WeightLearner.newWeights = function() {
    var _weights = new Array(STATISTICS);
    for (var _stat = 0; _stat < STATISTICS; _stat++) {
        _weights[_stat] = Math.random();
        if (NEGATIVES.includes(_stat)) {
            _weights[_stat] = -1 * _weights[_stat]
        }
    }
    return _weights;
}

WeightLearner.reset = function(game) {
    game.board.matrix = new Array(ROWS);
    for (var _row = 0; _row < ROWS; _row++) {
        game.board.matrix[_row] = new Array(COLS).fill(0);
    }
    game.board.newMatrix = game.board.matrix;
    game.pieceind = 0;
    game.shufflePieces();
    game.workingPiece = game.generatePiece();
    game.nextPiece = game.generatePiece();
    game.score = 0;
    game.previousScore = -BONUS;
    game.over = false;
    game.stopped = false;
    game.AI.active = true;
    game.bestRotation = 0;
    game.bestShift = 0;
    game.previousUpdateTime = Date.now();
    game.updateAI();
}

WeightLearner.copy = function(individual) {
    var _weights = new Array(STATISTICS);
    for (var _stat = 0; _stat < STATISTICS; _stat++) {
        _weights[_stat] = individual.weights[_stat];
    }
    return { weights: _weights, fitness: individual.fitness, probability: individual.probability };
}

WeightLearner.crossover = function(parent1, parent2) {
    var weights = [];
    for (var _stat = 0; _stat < STATISTICS - 1; _stat++) {
        weights[_stat] = (parent1.weights[_stat] * parent1.fitness + parent2.weights[_stat] * parent2.fitness) / (parent1.fitness + parent2.fitness);
    }
    return weights;
}

WeightLearner.mutate = function(individual) {
    for (var _stat = 0; _stat < STATISTICS; _stat++) {
        individual.weights[_stat] += (Math.random() - .5) * .05;
    }
}

WeightLearner.comparator = function(parent1, parent2) {
    return parent1.fitness - parent2.fitness;
}