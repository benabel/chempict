'use strict';

const ModelAtom = require('../src/model/atom');
const ModelBond = require('../src/model/bond');
const ModelMolecule = require('../src/model/molecule');

const SmilesParser = require('../src/io/smiles_parser');
const CoordinateGenerator = require('../src/layout/coordinate_generator');

/** Class containing utilities for tests. */
class Utils {
  /**
   * atom - static method to create an atom in specified coordinate
   *        default to carbon in (0,0)
   *
   * @static
   * @param  {string} optSymbol - symbole of the atom
   * @param  {number} optX      - x coordinate
   * @param  {number} optY      - y coordinate
   * @return {modelAtom}        - The atom model created
   */
  static atom(optSymbol, optX, optY) {
    const atom = new ModelAtom(optSymbol, optX, optY);
    return atom;
  }

  /**
   * bond - create bond between two atoms
   *        defaults to C at (0,0) and O at (1,1)
   *
   * @static
   * @return {modelBond} - the model bond
   */


  /**
   * bond - create bond between two atoms
   *        defaults to C at (0,0) and O at (1,1)
   *
   * @param  {type} optSymbol1 - atom source symbol
   * @param  {type} optX1      - atom source x coordinate
   * @param  {type} optY1      - atom source y coordinate
   * @param  {type} optSymbol2 - atom target symbol
   * @param  {type} optX2      - atom target x coordinate
   * @param  {type} optY2      - atom target x coordinate
   * @return {modelBond}       - the model bond
   */
  static bond(optSymbol1, optX1, optY1, optSymbol2, optX2, optY2) {
    // TODO: use default parameters when available in node
    let Symbol1 = arguments.length <= 0 || arguments[0] === undefined ? 'C' : arguments[0];
    let X1 = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    let Y1 = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    let Symbol2 = arguments.length <= 3 || arguments[3] === undefined ? 'O' : arguments[3];
    let X2 = arguments.length <= 4 || arguments[4] === undefined ? 1 : arguments[4];
    let Y2 = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
    const bond = new ModelBond(this.atom(Symbol1, X1, Y1), this.atom(Symbol2, X2, Y2));
    return bond;
  }

  /**
   * molecule - create a molecule with txo atoms
   *            defaults to C-O molecule with atom coordinates (0,0) and (1,1)
   *
   * @param  {type} optSymbol1 - atom source symbol
   * @param  {type} optX1      - atom source x coordinate
   * @param  {type} optY1      - atom source y coordinate
   * @param  {type} optSymbol2 - atom target symbol
   * @param  {type} optX2      - atom target x coordinate
   * @param  {type} optY2      - atom target x coordinate
   * @static
   * @return {modelMolecule}  - the model of the molecule
   */
  static molecule(optSymbol1, optX1, optY1, optSymbol2, optX2, optY2) {
    // TODO: use default parameters when available in node
    let Symbol1 = arguments.length <= 0 || arguments[0] === undefined ? 'C' : arguments[0];
    let X1 = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    let Y1 = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    let Symbol2 = arguments.length <= 3 || arguments[3] === undefined ? 'O' : arguments[3];
    let X2 = arguments.length <= 4 || arguments[4] === undefined ? 1 : arguments[4];
    let Y2 = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
    let molecule = new ModelMolecule();
    molecule.addBond(this.bond(optSymbol1, optX1, optY1, optSymbol2, optX2, optY2));
    return molecule;
  }

  /**
   *  moleculeFromSmiles - generate a model of a molecule from a smile string
   *
   * @static
   * @param  {string} smi    - the input smiles
   * @return {modelMolecule} - the model of the molecule generated
   */
  static moleculeFromSmiles(smi) {
    const mol = SmilesParser.parse(smi);
    CoordinateGenerator.generate(mol);
    return mol;
  }
}

module.exports = Utils;
