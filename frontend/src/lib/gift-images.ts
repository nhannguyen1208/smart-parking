/** Resolve gift image path from stored image or prize name. */
export function giftImageFor(name: string, image?: string | null) {
  if (image && image.startsWith("/")) return image;
  const n = name.toLowerCase();
  if (n.includes("water") || n.includes("bottle")) return "/gifts/gift-water-bottle.jpg";
  if (n.includes("teddy") || n.includes("bear") || n.includes("plush"))
    return "/gifts/gift-teddy-bear.jpg";
  if (n.includes("coffee")) return "/gifts/gift-coffee.jpg";
  if (n.includes("sticker") || n.includes("badge") || n.includes("pin"))
    return "/gifts/gift-stickers.jpg";
  if (n.includes("hoodie") || n.includes("tee")) return "/gifts/gift-hoodie.jpg";
  if (n.includes("snack")) return "/gifts/gift-snack.jpg";
  if (n.includes("parking") || n.includes("free day"))
    return "/gifts/gift-parking-pass.jpg";
  return "/gifts/gift-stickers.jpg";
}
