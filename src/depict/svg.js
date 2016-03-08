'use strict';

const svgConfig = require('./config');

// svg string
let sb = '';

class SvgDepict {
  constructor(mol) {
    // TODO: Use es6 default parameter for config when available in node
    this.config = svgConfig;
    this.mol = mol;
    this.sizeCalculator();
  }

  sizeCalculator() {
    const margin = this.config.marginWidth;
    this.scale = this.config.bondLength / this.mol.getAverageBondLength();
    const box = this.mol.getBoundingBox();  // getters: top bottom left right
    // translations
    this.dx = margin + this.scale * box.left;
    this.dy = margin + this.scale * box.top;
    // size
    this.w = 2 * margin + this.scale * (box.right - box.left);
    this.h = 2 * margin + this.scale * (box.bottom - box.top);
  }

  writeHeader() {
    sb += `
  <svg version="1.2"
       baseProfile="full"
       width="${this.w}" height="${this.h}"
       xmlns="http://www.w3.org/2000/svg">
  `;
  }

  _drawAtom(element) {
    const fontSize = this.config.fontSize;
    const symb = element.symbol;
    const coord = element.coord;
    const hydrogen = element.hydrogenCount();
    // used for subscript numbers
    const dy = fontSize / 2;
    let txt = `${symb}`;
    if (hydrogen > 1) {
      txt += `<tspan>H<tspan dy="${dy}">${hydrogen}</tspan></tspan>`;
    } else if (hydrogen === 1) {
      txt += '<tspan>H</tspan>';
    }
    let x = coord.x * this.scale - this.dx;
    let y = coord.y * this.scale - this.dy;
    // Text alignments
    // TODO: needs to be more general
    x -= fontSize / 2;
    y += 3 * fontSize / 8;
    sb += `<text x="${x}" y="${y}" font-family="Arial"
        font-size="${fontSize}"
        fill="black">${txt}</text>\n`;
  }

  drawAtoms() {
    // depict only heteroatoms
    let atoms = this.mol.atoms.filter(atom => atom.symbol === 'C' ? false : atom);
    atoms.forEach(this._drawAtom, this);
  }

  _drawBond(bond) {
    debugger;
    const lineWidth = this.config.lineWidth;
    const bondSpacing = this.config.bondSpacing;
    let x1 = bond.source.coord.x * this.scale - this.dx;
    let y1 = bond.source.coord.y * this.scale - this.dy;
    let x2 = bond.target.coord.x * this.scale - this.dx;
    let y2 = bond.target.coord.y * this.scale - this.dy;

    if (bond.order === 1) {
      sb += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black"
      stroke-width="${lineWidth}"/>\n`;
    } else if (bond.order === 2) {
      y1 += bondSpacing / 2;
      y2 += bondSpacing / 2;
      sb += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black"
      stroke-width="${lineWidth}"/>\n`;
      y1 -= bondSpacing;
      y2 -= bondSpacing;
      sb += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black"
      stroke-width="${lineWidth}"/>\n`;
    }
  }

  drawBonds() { this.mol.bonds.forEach(this._drawBond, this); }

  toSvg() {
    this.writeHeader();
    sb += '<rect width="100%" height="100%" fill="white"/>\n';
    this.drawAtoms();
    this.drawBonds();
    return sb + '</svg>';
  }
}

module.exports = SvgDepict;
