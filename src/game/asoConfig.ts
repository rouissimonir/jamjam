export interface AsoLocaleEntry {
  localeCode: string;
  localeName: string;
  title30: string;
  subtitle30: string;
  keywordField100: string; // Max 100 chars, comma-separated, zero spaces
}

/**
 * Blue-Ocean 10-Locale U.S. Cross-Localization Matrix (1,600 Characters of Indexing)
 * Apple indexes all 10 of these locales in the U.S. App Store simultaneously.
 * Targets untapped, high-intent cozy/ASMR clusters ("wax seal", "satin ribbon",
 * "asmr unbox", "gift unwrap", "heirloom sort", "no timer puzzle", "cozy untie").
 */
export const US_CROSS_LOCALIZATION_LOCALES: ReadonlyArray<AsoLocaleEntry> = [
  {
    localeCode: 'en-US',
    localeName: 'English (U.S. Primary)',
    title30: 'Royal Post: Wax & Ribbon',
    subtitle30: 'ASMR Seal & Satin Unbox Sort',
    keywordField100:
      'wax,seal,ribbon,unbox,asmr,sort,satin,parcel,gift,unwrap,royal,post,heirloom,untie,cozy,puzzle,zen',
  },
  {
    localeCode: 'es-MX',
    localeName: 'Spanish (Mexico)',
    title30: 'Wax Seal: Satin Ribbon Unbox',
    subtitle30: 'Relaxing Gift & Heirloom Sort',
    keywordField100:
      'stamp,signet,crest,silk,bow,knot,spool,bobbin,velvet,walnut,luxury,craft,atelier,curio,vintage,box',
  },
  {
    localeCode: 'ar',
    localeName: 'Arabic (U.S. Indexed)',
    title30: 'Satin Ribbon: ASMR Gift Sort',
    subtitle30: 'Crack Wax Seals & Unwrap Art',
    keywordField100:
      'envelope,letter,mail,chest,locket,egg,watch,music,celesta,chime,crack,snip,scissors,brass,rack,5',
  },
  {
    localeCode: 'zh-Hans',
    localeName: 'Chinese (Simplified)',
    title30: 'Royal Unbox: Wax Seal Puzzle',
    subtitle30: 'Untie Silk Ribbons & Collect',
    keywordField100:
      'tactile,sensory,haptic,crisp,calming,stress,relief,no,timer,offline,single,player,logic,tidy,layer',
  },
  {
    localeCode: 'zh-Hant',
    localeName: 'Chinese (Traditional)',
    title30: 'Heirloom Unbox: Ribbon Jam',
    subtitle30: 'Peel Wax & Wind Velvet Spools',
    keywordField100:
      'kyoto,lacquer,venetian,parisian,paris,antique,jewelry,keepsake,treasury,gallery,collect,unlock,3d',
  },
  {
    localeCode: 'fr-CA',
    localeName: 'French (Canada)',
    title30: 'Wax & Ribbon: Cozy Unwrap',
    subtitle30: 'Strategic Brass Rack Puzzle',
    keywordField100:
      'color,match,triple,three,queue,buffer,peg,slot,tray,swap,combo,fever,streak,brain,teaser,iq,smart',
  },
  {
    localeCode: 'ko',
    localeName: 'Korean (U.S. Indexed)',
    title30: 'ASMR Unbox: Royal Satin Sort',
    subtitle30: 'Wax Stamps, Silk & Music Box',
    keywordField100:
      'satisfying,soothing,whisper,soft,warm,candlelight,hint,colorblind,weave,stitch,embroidery,art,fun',
  },
  {
    localeCode: 'pt-BR',
    localeName: 'Portuguese (Brazil)',
    title30: 'Gift Unwrap: Wax & Silk Sort',
    subtitle30: 'No Timer Tactile Unboxing',
    keywordField100:
      'present,package,wrap,unseal,open,reveal,transform,story,chapter,companion,chronometer,orrery,tea',
  },
  {
    localeCode: 'ru',
    localeName: 'Russian (U.S. Indexed)',
    title30: 'Ribbon Sort: Royal Wax ASMR',
    subtitle30: 'Untie Knots & Open Heirlooms',
    keywordField100:
      'waxseal,satinribbon,asmrunbox,giftunwrap,royalpost,ribbonsort,cozypuzzle,heirloombox,notimer,calm',
  },
  {
    localeCode: 'vi',
    localeName: 'Vietnamese (U.S. Indexed)',
    title30: 'Parcel Sort: Wax Seal ASMR',
    subtitle30: 'Unwind Ribbons & Collect Gold',
    keywordField100:
      'silksort,waxstamp,unboxgame,tactilesort,parcelunbox,ateliergame,curioshelf,velvetbox,crown,relax',
  },
];

export const TARGET_KEYWORD_CLUSTERS = [
  { cluster: 'wax seal puzzle', difficulty: 14, volume: 'Med-High', status: 'Blue-Ocean Primary' },
  { cluster: 'asmr unbox', difficulty: 18, volume: 'High', status: 'Subtitle Indexed' },
  { cluster: 'satin ribbon sort', difficulty: 11, volume: 'Medium', status: 'Blue-Ocean Primary' },
  { cluster: 'gift unwrap cozy', difficulty: 16, volume: 'Med-High', status: 'Cross-Locale Indexed' },
  { cluster: 'no timer sort', difficulty: 21, volume: 'High', status: 'Cross-Locale Indexed' },
];
