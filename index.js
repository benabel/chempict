'use strict';

const VERSION = require('json!./package.json').version;

const SmilesParser = require('./src/io/smiles_parser');
const WriteChemdoodleJson = require('./src/io/write_chemdoodlejson');
const CoordinateGenerator = require('./src/layout/coordinate_generator');
const SvgDepict = require('./src/depict/svg');

const ChemPict = {
  SmilesParser: SmilesParser,
  WriteChemdoodleJson: function(arg) { return new WriteChemdoodleJson(arg); },
  CoordinateGenerator: CoordinateGenerator,
  SvgDepict: SvgDepict,
  getVersion: VERSION
};

module.exports = ChemPict;
