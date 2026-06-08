// src/constants/patterns.js
// 80+ Patterns — Sand Art Style (grayscale previews, no colorful emojis)

export const PATTERN_CATEGORIES = [
  { id: 'all',       name: 'All',       icon: 'grid-outline' },
  { id: 'favorites', name: 'Favorites', icon: 'heart-outline' },
  { id: 'featured',  name: 'Featured',  icon: 'star-outline' },
  { id: 'geometric', name: 'Geometric', icon: 'shapes-outline' },
  { id: 'nature',    name: 'Nature',    icon: 'leaf-outline' },
  { id: 'mandala',   name: 'Mandala',   icon: 'radio-button-on-outline' },
  { id: 'abstract',  name: 'Abstract',  icon: 'aperture-outline' },
  { id: 'animals',   name: 'Animals',   icon: 'paw-outline' },
  { id: 'space',     name: 'Space',     icon: 'planet-outline' },
  { id: 'zen',       name: 'Zen',       icon: 'water-outline' },
  { id: 'maze',      name: 'Maze',      icon: 'map-outline' },
  { id: 'fractal',   name: 'Fractal',   icon: 'infinite-outline' },
];

export const PATTERNS = [
  // FEATURED
  { id: 'f001', name: 'Golden Spiral',     category: 'featured',  duration: 18, file: 'golden_spiral.gcode',   description: 'Fibonacci golden ratio spiral — the most satisfying pattern',  difficulty: 'smooth',   isNew: false },
  { id: 'f002', name: 'Ocean Waves',       category: 'featured',  duration: 22, file: 'ocean_waves.gcode',     description: 'Flowing parallel waves rippling across the sand',              difficulty: 'smooth',   isNew: false },
  { id: 'f003', name: 'Sacred Geometry',   category: 'featured',  duration: 38, file: 'sacred_geo.gcode',      description: 'Ancient geometric patterns found throughout nature',           difficulty: 'complex',  isNew: true  },
  { id: 'f004', name: 'Zen Concentric',    category: 'featured',  duration: 12, file: 'zen_concentric.gcode',  description: 'Perfectly spaced concentric circles radiating outward',        difficulty: 'smooth',   isNew: false },
  { id: 'f005', name: 'Lotus Bloom',       category: 'featured',  duration: 30, file: 'lotus_bloom.gcode',     description: 'Eight-petal lotus flower with intricate inner detail',         difficulty: 'detailed', isNew: true  },
  { id: 'f006', name: 'Galaxy Arms',       category: 'featured',  duration: 35, file: 'galaxy_arms.gcode',     description: 'Sweeping spiral galaxy arms across the sand',                  difficulty: 'detailed', isNew: true  },

  // GEOMETRIC
  { id: 'g001', name: 'Hexagon Grid',      category: 'geometric', duration: 25, file: 'hexagon_grid.gcode',    description: 'Perfect honeycomb hexagonal tessellation',                    difficulty: 'detailed', isNew: false },
  { id: 'g002', name: 'Triangle Web',      category: 'geometric', duration: 28, file: 'triangle_web.gcode',    description: 'Interconnected triangle network',                              difficulty: 'detailed', isNew: false },
  { id: 'g003', name: 'Pentagon Spiral',   category: 'geometric', duration: 22, file: 'pentagon.gcode',        description: 'Five-sided spiral growth pattern',                            difficulty: 'smooth',   isNew: false },
  { id: 'g004', name: 'Diamond Lattice',   category: 'geometric', duration: 20, file: 'diamond_lattice.gcode', description: 'Repeating diamond shapes in a tight lattice',                 difficulty: 'smooth',   isNew: false },
  { id: 'g005', name: 'Celtic Knot',       category: 'geometric', duration: 45, file: 'celtic_knot.gcode',     description: 'Ancient interlacing Celtic knotwork',                         difficulty: 'complex',  isNew: false },
  { id: 'g006', name: 'Flower of Life',    category: 'geometric', duration: 50, file: 'flower_of_life.gcode',  description: 'Ancient symbol of overlapping circles',                       difficulty: 'complex',  isNew: false },
  { id: 'g007', name: 'Metatrons Cube',    category: 'geometric', duration: 40, file: 'metatron.gcode',        description: 'Sacred geometry Metatrons Cube pattern',                      difficulty: 'complex',  isNew: true  },
  { id: 'g008', name: 'Labyrinth',         category: 'geometric', duration: 48, file: 'labyrinth.gcode',       description: 'Classic single-path ancient labyrinth',                       difficulty: 'complex',  isNew: false },
  { id: 'g009', name: 'Moroccan Tile',     category: 'geometric', duration: 42, file: 'moroccan.gcode',        description: 'Traditional Moroccan zellige tilework',                       difficulty: 'complex',  isNew: true  },
  { id: 'g010', name: 'Star Polygon',      category: 'geometric', duration: 18, file: 'star_polygon.gcode',    description: 'Multi-pointed star polygon',                                  difficulty: 'smooth',   isNew: false },

  // NATURE
  { id: 'n001', name: 'Fern Fractal',      category: 'nature',    duration: 32, file: 'fern_fractal.gcode',    description: 'Barnsley fern mathematical fractal',                          difficulty: 'detailed', isNew: false },
  { id: 'n002', name: 'Snowflake',         category: 'nature',    duration: 18, file: 'snowflake.gcode',       description: 'Six-fold crystalline snowflake symmetry',                     difficulty: 'smooth',   isNew: false },
  { id: 'n003', name: 'Sunflower Seeds',   category: 'nature',    duration: 35, file: 'sunflower.gcode',       description: 'Fibonacci sunflower seed spiral arrangement',                 difficulty: 'detailed', isNew: false },
  { id: 'n004', name: 'Tree Rings',        category: 'nature',    duration: 20, file: 'tree_rings.gcode',      description: 'Cross-section of tree growth rings',                          difficulty: 'smooth',   isNew: false },
  { id: 'n005', name: 'Nautilus Shell',    category: 'nature',    duration: 22, file: 'nautilus.gcode',        description: 'Nautilus shell logarithmic spiral',                           difficulty: 'smooth',   isNew: true  },
  { id: 'n006', name: 'Leaf Veins',        category: 'nature',    duration: 28, file: 'leaf_veins.gcode',      description: 'Detailed leaf vein network branching pattern',                difficulty: 'detailed', isNew: false },
  { id: 'n007', name: 'Wave Ripples',      category: 'nature',    duration: 16, file: 'ripples.gcode',         description: 'Concentric ripples spreading from center',                    difficulty: 'smooth',   isNew: false },
  { id: 'n008', name: 'Coral Reef',        category: 'nature',    duration: 45, file: 'coral.gcode',           description: 'Intricate branching coral structure',                         difficulty: 'complex',  isNew: true  },

  // MANDALA
  { id: 'm001', name: 'Classic Mandala',   category: 'mandala',   duration: 50, file: 'classic_mandala.gcode', description: '12-fold symmetry traditional mandala',                        difficulty: 'complex',  isNew: false },
  { id: 'm002', name: 'Sun Mandala',       category: 'mandala',   duration: 42, file: 'sun_mandala.gcode',     description: 'Radiant sun with 16 detailed ray petals',                     difficulty: 'complex',  isNew: false },
  { id: 'm003', name: 'Tibetan Wheel',     category: 'mandala',   duration: 60, file: 'tibetan.gcode',         description: 'Intricate Tibetan dharma wheel mandala',                      difficulty: 'complex',  isNew: false },
  { id: 'm004', name: 'Rose Window',       category: 'mandala',   duration: 45, file: 'rose_window.gcode',     description: 'Gothic cathedral rose window geometry',                       difficulty: 'complex',  isNew: false },
  { id: 'm005', name: 'Lotus Mandala',     category: 'mandala',   duration: 48, file: 'lotus_mandala.gcode',   description: '24-petal lotus mandala with sacred geometry',                 difficulty: 'complex',  isNew: true  },
  { id: 'm006', name: 'Star Mandala',      category: 'mandala',   duration: 38, file: 'star_mandala.gcode',    description: 'Eight-pointed star mandala pattern',                          difficulty: 'detailed', isNew: false },

  // ABSTRACT
  { id: 'ab001', name: 'Lissajous 3:2',   category: 'abstract',  duration: 20, file: 'lissajous_32.gcode',    description: 'Mathematical Lissajous curve ratio 3:2',                      difficulty: 'smooth',   isNew: false },
  { id: 'ab002', name: 'Spirograph A',    category: 'abstract',  duration: 28, file: 'spirograph_a.gcode',    description: 'Classic spirograph epicycloid curve',                         difficulty: 'smooth',   isNew: false },
  { id: 'ab003', name: 'Spirograph B',    category: 'abstract',  duration: 32, file: 'spirograph_b.gcode',    description: 'Hypotrochoid spirograph variation',                           difficulty: 'smooth',   isNew: false },
  { id: 'ab004', name: 'Voronoi Cells',   category: 'abstract',  duration: 40, file: 'voronoi.gcode',         description: 'Random Voronoi cellular decomposition',                       difficulty: 'complex',  isNew: true  },
  { id: 'ab005', name: 'Harmonograph',    category: 'abstract',  duration: 35, file: 'harmonograph.gcode',    description: 'Pendulum harmonograph decaying spiral',                       difficulty: 'detailed', isNew: false },
  { id: 'ab006', name: 'Rose Curve',      category: 'abstract',  duration: 18, file: 'rose_curve.gcode',      description: 'Rhodonea mathematical rose curve',                            difficulty: 'smooth',   isNew: false },
  { id: 'ab007', name: 'Fermat Spiral',   category: 'abstract',  duration: 20, file: 'fermat.gcode',          description: 'Fermat parabolic spiral pattern',                             difficulty: 'smooth',   isNew: true  },

  // ANIMALS
  { id: 'a001', name: 'Humpback Whale',   category: 'animals',   duration: 28, file: 'whale.gcode',           description: 'Majestic humpback whale swimming in sand',                    difficulty: 'detailed', isNew: false },
  { id: 'a002', name: 'Eagle',            category: 'animals',   duration: 35, file: 'eagle.gcode',           description: 'Soaring eagle with spread wings',                             difficulty: 'detailed', isNew: false },
  { id: 'a003', name: 'Koi Pair',         category: 'animals',   duration: 32, file: 'koi_pair.gcode',        description: 'Two koi fish in yin-yang formation',                          difficulty: 'detailed', isNew: false },
  { id: 'a004', name: 'Butterfly',        category: 'animals',   duration: 30, file: 'butterfly.gcode',       description: 'Detailed butterfly wing symmetry',                            difficulty: 'detailed', isNew: true  },
  { id: 'a005', name: 'Peacock Feather',  category: 'animals',   duration: 38, file: 'peacock.gcode',         description: 'Intricate peacock feather eye pattern',                       difficulty: 'complex',  isNew: false },
  { id: 'a006', name: 'Sea Turtle',       category: 'animals',   duration: 28, file: 'turtle.gcode',          description: 'Sea turtle shell geometric pattern',                          difficulty: 'detailed', isNew: true  },

  // SPACE
  { id: 's001', name: 'Galaxy Spiral',    category: 'space',     duration: 35, file: 'galaxy.gcode',          description: 'Barred spiral galaxy arm structure',                          difficulty: 'detailed', isNew: false },
  { id: 's002', name: 'Black Hole',       category: 'space',     duration: 28, file: 'blackhole.gcode',       description: 'Gravitational lensing accretion spiral',                      difficulty: 'smooth',   isNew: false },
  { id: 's003', name: 'Nebula',           category: 'space',     duration: 40, file: 'nebula.gcode',          description: 'Cosmic gas cloud nebula swirls',                              difficulty: 'complex',  isNew: true  },
  { id: 's004', name: 'Pulsar Waves',     category: 'space',     duration: 22, file: 'pulsar.gcode',          description: 'Radio waves from a rotating pulsar',                          difficulty: 'smooth',   isNew: false },
  { id: 's005', name: 'Supernova',        category: 'space',     duration: 30, file: 'supernova.gcode',       description: 'Exploding star shockwave rings',                              difficulty: 'detailed', isNew: true  },

  // ZEN
  { id: 'z001', name: 'Enso Circle',      category: 'zen',       duration: 8,  file: 'enso.gcode',            description: 'Japanese Zen circle — imperfect perfection',                  difficulty: 'smooth',   isNew: false },
  { id: 'z002', name: 'Zen Rake',         category: 'zen',       duration: 20, file: 'zen_rake.gcode',        description: 'Traditional Japanese zen garden rake lines',                  difficulty: 'smooth',   isNew: false },
  { id: 'z003', name: 'Yin Yang',         category: 'zen',       duration: 22, file: 'yin_yang.gcode',        description: 'Classic yin yang duality symbol',                             difficulty: 'smooth',   isNew: false },
  { id: 'z004', name: 'Om Symbol',        category: 'zen',       duration: 35, file: 'om.gcode',              description: 'Sacred Om symbol in mandala form',                            difficulty: 'detailed', isNew: false },
  { id: 'z005', name: 'Stone Garden',     category: 'zen',       duration: 18, file: 'stone_garden.gcode',    description: 'Raked sand around stone circles',                             difficulty: 'smooth',   isNew: false },

  // MAZE
  { id: 'mz001', name: 'Circle Maze',    category: 'maze',      duration: 45, file: 'circle_maze.gcode',     description: 'Circular maze with single solution path',                     difficulty: 'complex',  isNew: false },
  { id: 'mz002', name: 'Square Maze',    category: 'maze',      duration: 50, file: 'square_maze.gcode',     description: 'Classic rectangular grid maze',                               difficulty: 'complex',  isNew: false },
  { id: 'mz003', name: 'Spiral Maze',    category: 'maze',      duration: 48, file: 'spiral_maze.gcode',     description: 'Spiral-based maze with circular paths',                       difficulty: 'complex',  isNew: true  },

  // FRACTAL
  { id: 'fr001', name: 'Sierpinski',     category: 'fractal',   duration: 55, file: 'sierpinski.gcode',      description: 'Sierpinski triangle recursive fractal',                       difficulty: 'complex',  isNew: false },
  { id: 'fr002', name: 'Koch Snowflake', category: 'fractal',   duration: 50, file: 'koch.gcode',            description: 'Koch snowflake fractal curve',                                difficulty: 'complex',  isNew: false },
  { id: 'fr003', name: 'Dragon Curve',   category: 'fractal',   duration: 45, file: 'dragon.gcode',          description: 'Heighway dragon curve fractal',                               difficulty: 'complex',  isNew: false },
  { id: 'fr004', name: 'Hilbert Curve',  category: 'fractal',   duration: 60, file: 'hilbert.gcode',         description: 'Space-filling Hilbert curve fractal',                         difficulty: 'complex',  isNew: true  },
];

export const getDifficultyColor = (d) => {
  switch (d) {
    case 'smooth':   return '#52C87A';
    case 'detailed': return '#F0A500';
    case 'complex':  return '#E05A5A';
    default:         return '#888';
  }
};

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
