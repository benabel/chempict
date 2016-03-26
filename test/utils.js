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
   * @return {modelAtom}             - The atom model created
   */
  static atom(optSymbol, optX, optY) {
    const atom = new ModelAtom(optSymbol, optX, optY);
    return atom;
  }

  /**
   * bond - create a C-O bond between (0,0) and (1,1)
   *
   * @static
   * @return {modelBond} - the model of C-O bond
   */
  static bond() {
    const bond = new ModelBond(this.atom('C', 0, 0), this.atom('O', 1, 1));
    return bond;
  }

  /**
   * molecule - create a C-O molecule with ayom coordinates (0,0) and (1,1)
   *
   * @static
   * @return {modelMolecule}  - the model of the C-O molecule
   */
  static molecule() {
    let molecule = new ModelMolecule();
    molecule.addBond(this.bond());
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
