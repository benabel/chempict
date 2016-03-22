'use strict';

const VERSION = require('json!../package.json').version;

const SmilesParser = require('./io/smiles_parser');
const WriteChemdoodleJson = require('./io/write_chemdoodlejson');
const CoordinateGenerator = require('./layout/coordinate_generator');
const SvgDepict = require('./depict/svg');

const ChemPict = {
  SmilesParser: SmilesParser,
  WriteChemdoodleJson: function(arg) { return new WriteChemdoodleJson(arg); },
  CoordinateGenerator: CoordinateGenerator,
  SvgDepict: SvgDepict,
  getVersion: VERSION
};

module.exports = ChemPict;
