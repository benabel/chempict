'use strict';

const fs = require('fs');
const SmilesParser = require('../src/io/smiles_parser');
const CoordinateGenerator = require('../src/layout/coordinate_generator');
const jsonWriter = require('../src/io/write_chemdoodlejson');


const smiles = 'CC(=O)OC1=CC=CC=C1C(=O)O';
// lactose
// const smiles =
//     'C([C@@H]1[C@@H]([C@@H]([C@H]([C@@H](O1)O[C@@H]2[C@H](O[C@H]([C@@H]([C@H]2O)O)O)CO)O)O)O)O';
// const smiles = 'CCCC(O)=O';
// const smiles = 'O=C=O';
const mol = SmilesParser.parse(smiles);

CoordinateGenerator.generate(mol);

const writer = new jsonWriter(mol);
const chemJson = writer.toJson();
// write json file
fs.writeFile('/home/ben/Bureau/mol.json', chemJson, function(err) {
  if (err) {
    return console.log(err);
  }

  console.log('Le json est enregistré sur le Bureau');
});
