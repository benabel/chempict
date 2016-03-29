'use strict';

const svgConfig = require('./config');
const HydrogenPosition = require('../renderer/hydrogen_position');

// svg string
let sb = '';

class SvgDepict {
  /**
   * constructor - Load config and calculate size of the depiction
   *
   * @param  {modelMolecule} mol - Molecule to display
   */
  constructor(mol) {
    // TODO: Use es6 default parameter for config when available in node
    this.config = svgConfig;
    this.mol = mol;
    this.sizeCalculator();
  }

  sizeCalculator() {
    this.scale = this.config.bondLength / this.mol.getAverageBondLength();
    const margin = this.scale * this.config.marginWidth;
    const box = this.mol.getBoundingBox();  // getters: top bottom left right
    // translations
    this.dx = this.scale * box.left - margin;
    this.dy = this.scale * box.top - margin;
    // size
    this.w = this.scale * (box.right - box.left) + 2 * margin;
    this.h = this.scale * (box.bottom - box.top) + 2 * margin;
  }

  writeHeader(bgColor) {
    sb = `
<svg version='1.2'
    baseProfile='full'
    width='${this.w}' height='${this.h}'
    xmlns='http://www.w3.org/2000/svg'>
<defs>
    <filter x='0.05' y='0' width='1.05' height='1.2' id='solid-bg'>
        <feFlood flood-color='${bgColor}'/>
        <feComposite in='SourceGraphic'/>
    </filter>
</defs>

<rect width='100%' height='100%' fill='${bgColor}' stroke='black'/>
  `;
  }

  _drawAtom(element) {
    const fontSize = this.config.fontSize;
    const symb = element.symbol;
    const coord = element.coord;
    const hydrogen = element.hydrogenCount();
    const hydrogenPosition = new HydrogenPosition(element).getHydrogenPosition();
    // used for subscript numbers
    const dy = fontSize / 2;
    let dx = 0;
    // for hydrogens labels on the left
    if (hydrogenPosition === 'Left') {
      dx = -fontSize;
    }
    let txt = `${symb}`;
    if (hydrogen > 1) {
      txt += `<tspan dx=${2*dx}>H<tspan dy='${dy}'>${hydrogen}</tspan></tspan>`;
    } else if (hydrogen === 1) {
      txt += `<tspan dx=${dx}>H</tspan>`;
    }
    let x = coord.x * this.scale - this.dx;
    let y = coord.y * this.scale - this.dy;
    // Text alignments
    // TODO: needs to be more general
    x -= fontSize / 2.5;
    y += 3 * fontSize / 8;
    sb += `<text x='${x}' y='${y}' font-family='Arial'
        font-size='${fontSize}'
        fill='black'
        filter='url(#solid-bg)'\n>${txt}</text>\n`;
  }

  /**
  * _selectAtoms - select atoms for depiction
  * Cuurently depict only hetroatoms and terminal carbons if config
  * displayTerminalCarbonLabels is true
  *
  * @param  {modelAtom} atom - input atom
  *
  * @return {boolean} - does the input atom should be displayed or not
  */
  _selectAtom(atom) {
    const c = this.config;
    switch (c.displayCarbonLabels) {
      case 'all':
        return atom;
      case 'none':
        return atom.symbol === 'C' ? false : atom;
      case 'terminal':
      default: {
        let output = false;
        if (atom.symbol !== 'C' || (atom.symbol === 'C' && atom.getNeighbors().length < 2)) {
          output = atom;
        }
        return output;
      }
    }
  }

  drawAtoms() {
    let atoms = this.mol.atoms.filter(this._selectAtom, this);
    atoms.forEach(this._drawAtom, this);
  }

  _drawBond(bond) {
    const lineWidth = this.config.lineWidth;
    const bondSpacing = this.config.bondSpacing;
    let x1 = bond.source.coord.x * this.scale - this.dx;
    let y1 = bond.source.coord.y * this.scale - this.dy;
    let x2 = bond.target.coord.x * this.scale - this.dx;
    let y2 = bond.target.coord.y * this.scale - this.dy;

    if (bond.order === 1) {
      sb += `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='black'
      stroke-width='${lineWidth}'/>\n `;
    } else if (bond.order === 2) {
      y1 += bondSpacing / 2;
      y2 += bondSpacing / 2;
      sb += `<line x1 = '${x1}' y1 = '${y1}' x2 = '${x2}' y2 = '${y2}' stroke =
                  'black' stroke - width = '${lineWidth}'/>\n `;
      y1 -= bondSpacing;
      y2 -= bondSpacing;
      sb += `<line x1 = '${x1}' y1 = '${y1}' x2 = '${x2}' y2 = '${y2}' stroke =
                  'black' stroke - width = '${lineWidth}'/>\n`;
    }
  }

  drawBonds() { this.mol.bonds.forEach(this._drawBond, this); }

  toSvg() {
    this.writeHeader(this.config.bgColor);
    sb += '\n';
    this.drawBonds();
    // atoms must be drawn after to hide part of the bonds
    this.drawAtoms();
    return sb + '</svg>';
  }
}

module.exports = SvgDepict;
