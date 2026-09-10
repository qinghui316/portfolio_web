import paper from '../../assets/about/dossier.webp';
import backing from '../../assets/about/comic-backing.webp';
import characterDefault from '../../assets/about/character-default.webp';
import characterActive from '../../assets/about/character-active.webp';
import model from '../../assets/about/card.glb';
import badgeAtlas from '../../assets/about/badge-atlas.webp';
import band from '../../assets/about/lanyard-fabric.webp';
import staticFront from '../../assets/about/badge-static-front.webp';
import staticBack from '../../assets/about/badge-static-back.webp';

export const ABOUT_ASSETS = {
  paper,
  backing,
  characterDefault,
  characterActive,
  model,
  badgeAtlas,
  band,
  staticFront,
  staticBack,
};

export const ABOUT_ESSENTIAL_ASSETS = [paper, backing, characterDefault, staticFront, staticBack];
export const ABOUT_INTERACTIVE_IMAGES = [characterActive, badgeAtlas, band];
