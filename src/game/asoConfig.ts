export interface AsoLocaleEntry {
  localeCode: string;
  localeName: string;
  title30: string;
  subtitle30: string;
  keywordField100: string; // Max 100 chars, comma-separated, zero spaces
}

/**
 * Pillar D: The 10-Locale U.S. Cross-Localization Matrix (1,600 Characters of Indexing)
 * Apple indexes all 10 of these locales in the U.S. App Store simultaneously.
 * Targets uncrowded mid-competition 3rd-Gen tactile clusters ("glass puzzle", "unpin sort",
 * "acrylic jam", "color unpack", "tidy logic", "stained mosaic", "yarn unpin", "bento unpack").
 */
export const US_CROSS_LOCALIZATION_LOCALES: ReadonlyArray<AsoLocaleEntry> = [
  {
    localeCode: 'en-US',
    localeName: 'English (U.S. Primary)',
    title30: 'Glass Unpin: Color Unpack Jam',
    subtitle30: 'Tactile Acrylic & Mosaic Sort',
    keywordField100:
      'glass,puzzle,unpin,sort,acrylic,jam,color,unpack,tidy,logic,mosaic,clasp,crystal,pendulum,layer,3d',
  },
  {
    localeCode: 'es-MX',
    localeName: 'Spanish (Mexico)',
    title30: 'Acrylic Jam: Tidy Logic Sort',
    subtitle30: 'Stained Glass & Yarn Unpin 3D',
    keywordField100:
      'stained,yarn,knit,wool,ribbon,sewing,pin,bento,box,toy,gadget,watch,console,clear,shatter,chime,tap',
  },
  {
    localeCode: 'ar',
    localeName: 'Arabic (U.S. Indexed)',
    title30: 'Color Unpack: Stained Mosaic',
    subtitle30: 'Unpin Layered Glass & Ribbons',
    keywordField100:
      'translucent,plate,slab,brass,clasp,buffer,toolbox,workshop,renovate,atelier,relax,asmr,tactile,drop',
  },
  {
    localeCode: 'zh-Hans',
    localeName: 'Chinese (Simplified)',
    title30: 'Unpin Sort: Tactile Bento Box',
    subtitle30: '3D Layered Toy & Glass Puzzle',
    keywordField100:
      'unbox,disassemble,teardown,retro,handheld,chrono,gear,jewel,cabochon,prism,shard,swing,gravity,free',
  },
  {
    localeCode: 'zh-Hant',
    localeName: 'Chinese (Traditional)',
    title30: 'Tidy Logic: Crystal Unpin Jam',
    subtitle30: 'Match Clasps & Shatter Glass',
    keywordField100:
      'embroidery,stitch,skein,spool,thread,fabric,weave,velvet,pearl,needle,unravel,cozy,craft,mosaic,art',
  },
  {
    localeCode: 'fr-CA',
    localeName: 'French (Canada)',
    title30: 'Glass Puzzle: Acrylic Unpack',
    subtitle30: '2.5D Tilt & Pendulum Physics',
    keywordField100:
      'brain,teaser,iq,spatial,depth,tilt,inspect,overlap,occlude,xray,magnet,revive,streak,booster,pocket',
  },
  {
    localeCode: 'ko',
    localeName: 'Korean (U.S. Indexed)',
    title30: 'Knit & Glass: Unpin Sort 3D',
    subtitle30: 'Pull Pins & Unravel Ribbons',
    keywordField100:
      'satisfying,haptic,vibrate,clack,ratchet,ding,bell,harmonic,zen,offline,no,wifi,single,player,casual',
  },
  {
    localeCode: 'pt-BR',
    localeName: 'Portuguese (Brazil)',
    title30: 'Bento Unpack: Tidy Glass Jam',
    subtitle30: 'Sort Colored Pins & Toolboxes',
    keywordField100:
      'organizer,drawer,slot,socket,hole,tray,pack,match,triple,three,queue,drain,combo,chain,master,level',
  },
  {
    localeCode: 'ru',
    localeName: 'Russian (U.S. Indexed)',
    title30: 'Mosaic Unpin: Crystal Sort 3D',
    subtitle30: 'Tactile Glass & Gadget Puzzle',
    keywordField100:
      'stainedglass,glasspuzzle,unpinsort,acrylicjam,colorunpack,tidylogic,knitout,woolsort,pinjam,screwdom',
  },
  {
    localeCode: 'vi',
    localeName: 'Vietnamese (U.S. Indexed)',
    title30: 'Acrylic Sort: Color Unpack 3D',
    subtitle30: 'Unpin Clasps & Restore Studio',
    keywordField100:
      'stainedmosaic,yarnunpin,bentosort,toyunpack,crystaljam,clasppuzzle,ribbonsort,glassasmr,tidysort,2d',
  },
];

export const TARGET_KEYWORD_CLUSTERS = [
  { cluster: 'glass puzzle', difficulty: 28, volume: 'High', status: 'Primary Title/Keyword' },
  { cluster: 'unpin sort', difficulty: 24, volume: 'Med-High', status: 'Primary Title/Keyword' },
  { cluster: 'acrylic jam', difficulty: 19, volume: 'Medium', status: 'Subtitle Indexed' },
  { cluster: 'color unpack', difficulty: 31, volume: 'High', status: 'Primary Title/Keyword' },
  { cluster: 'tidy logic', difficulty: 22, volume: 'Medium', status: 'Cross-Locale Indexed' },
];
