// Keep IDs stable: saved cards and sticker placements refer to them.
// `self` is shared by the page and service worker, so both use this catalog.
const creativeRoot = "assets/board/creative";
const boardArtwork = (id, name, folder, file, sourceWidth, sourceHeight, maxSize = 140) => {
  const scale = maxSize / Math.max(sourceWidth, sourceHeight);
  return {
    id, name, src: `${creativeRoot}/${folder}/${file}.svg`,
    width: Math.max(36, Math.round(sourceWidth * scale)), height: Math.round(sourceHeight * scale),
  };
};
const paperArtwork = (id, name, sourceWidth, sourceHeight) => {
  const desktopHeight = 881;
  const mobileHeight = 810;
  const aspectRatio = sourceWidth / sourceHeight;
  return {
    id, name, src: `${creativeRoot}/papers/${id}.svg`,
    widthDesktop: Math.round(desktopHeight * aspectRatio),
    heightDesktop: desktopHeight,
    widthMobile: Math.round(mobileHeight * aspectRatio),
    heightMobile: mobileHeight,
  };
};

self.PAPER_ASSETS = [
  paperArtwork("spiral-notepad-pencil", "Notepad dan pensil", 2737, 3902),
  paperArtwork("spiral-notepad-corner-tape", "Notepad selotip sudut", 2944, 3868),
  paperArtwork("spiral-notepad-top-tape", "Notepad selotip atas", 2737, 3763),
  paperArtwork("spiral-notepad-two-tapes", "Notepad dua selotip", 3059, 3761),
];

self.BOARD_ASSETS = [
  // Preserve the original IDs for boards already stored on this device.
  { id: "leaf", name: "Daun", src: "assets/board/leaf.svg", width: 130, height: 160 },
  { id: "star", name: "Bintang", src: "assets/board/star.svg", width: 115, height: 115 },
  { id: "tape", name: "Selotip", src: "assets/board/tape.svg", width: 150, height: 65 },
  boardArtwork("lined-note", "Kertas bergaris", "stickers", "lined-note", 4823, 1008, 220),
  boardArtwork("folded-sticky-note", "Sticky note lipat", "stickers", "folded-sticky-note", 2114, 1931, 180),
  boardArtwork("taped-sheet", "Kertas berselotip", "stickers", "taped-sheet", 6139, 4351, 180),
  boardArtwork("blue-tape", "Selotip biru", "tapes", "blue-tape", 1866, 465, 180),
  boardArtwork("patterned-blue-tape", "Selotip biru bermotif", "tapes", "patterned-blue-tape", 1866, 465, 180),
  boardArtwork("beige-tape", "Selotip krem", "tapes", "beige-tape", 2008, 299, 180),
  boardArtwork("chocolate-bar", "Cokelat", "stickers", "chocolate-bar", 956, 930),
  boardArtwork("four-petal-flower", "Bunga", "stickers", "four-petal-flower", 577, 577),
  boardArtwork("cat-neutral", "Kucing", "stickers", "cat-neutral", 963, 992),
  boardArtwork("cat-winking", "Kucing mengedip", "stickers", "cat-winking", 963, 992),
  boardArtwork("cat-sparkly-eyes", "Kucing mata berbinar", "stickers", "cat-sparkly-eyes", 963, 992),
  boardArtwork("cat-x-eyes", "Kucing mata silang", "stickers", "cat-x-eyes", 963, 992),
  boardArtwork("megaphone", "Megafon", "stickers", "megaphone", 637, 460),
  boardArtwork("coffee-cup", "Cangkir kopi", "stickers", "coffee-cup", 1422, 1857),
  boardArtwork("coffee-bean", "Biji kopi", "stickers", "coffee-bean", 565, 624),
  boardArtwork("smiley", "Senyum", "stickers", "smiley", 921, 921),
  boardArtwork("creative-star", "Bintang kreatif", "stickers", "star", 719, 721),
  boardArtwork("alarm-clock", "Jam weker", "stickers", "alarm-clock", 746, 739),
  boardArtwork("brown-pencil", "Pensil cokelat", "stationery", "brown-pencil", 248, 2222, 165),
  boardArtwork("blue-pencil", "Pensil biru", "stationery", "blue-pencil", 248, 2230, 165),
  boardArtwork("paperclip", "Penjepit kertas", "stationery", "paperclip", 511, 790),
  boardArtwork("meme-stop", "Stop", "memes", "stop", 1243, 1239, 130),
  boardArtwork("meme-panda", "Panda", "memes", "panda", 1243, 1239, 130),
  boardArtwork("meme-besok-aja-lah", "Besok aja lah", "memes", "besok-aja-lah", 1243, 1239, 130),
  boardArtwork("meme-waduh", "Waduh", "memes", "waduh", 1243, 1239, 130),
  boardArtwork("meme-standing-cat", "Kucing berdiri", "memes", "standing-cat", 1243, 1239, 130),
  boardArtwork("meme-rabbit-with-clock", "Kelinci dan jam", "memes", "rabbit-with-clock", 1243, 1239, 130),
  boardArtwork("meme-shouting-cat", "Kucing berteriak", "memes", "shouting-cat", 1243, 1239, 130),
  boardArtwork("meme-sudah-siap", "Sudah siap", "memes", "sudah-siap", 1243, 1239, 130),
  boardArtwork("meme-ayo-nima", "Ayo Nima", "memes", "ayo-nima", 1243, 1239, 130),
  boardArtwork("meme-pura-pura-gak-liat", "Pura-pura gak lihat", "memes", "pura-pura-gak-liat", 1243, 1239, 130),
];
