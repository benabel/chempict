'use strict';

const fs = require('fs');
const SmilesParser = require('../src/io/smiles_parser');
const CoordinateGenerator = require('../src/layout/coordinate_generator');
const JsonWriter = require('../src/io/write_chemdoodlejson');


const smiles = [
  'N[C@@H](CCC(=O)N[C@@H](CSSC[C@H](NC(=O)CC[C@H](N)C(O)=O)C(=O)NCC(O)=O)C(=O)NCC(O)=O)C(O)=O',
  'O=C(O)c1ccccc1OC(=O)C', 'CC(=O)OC1=CC=CC=C1C(=O)O',
  'C([C@@H]1[C@@H]([C@@H]([C@H]([C@@H](O1)O[C@@H]2[C@H](O[C@H]([C@@H]([C@H]2O)O)O)CO)O)O)O)O',
  'CCCC(O)=O', 'O=C=O'
];

const smi2json = function(smi) {
  const mol = SmilesParser.parse(smi);
  CoordinateGenerator.generate(mol);
  const writer = new JsonWriter(mol);
  const chemJson = writer.toJson();
  return chemJson;
};

for (let i = 0; i < smiles.length; i++) {
  smi2json(smiles[i]);
}

// write json file
fs.writeFile('/home/ben/Bureau/mol.json', smi2json(smiles[0]), function(err) {
  if (err) {
    return console.log(err);
  }

  console.log('Le json est enregistré sur le Bureau');
});
