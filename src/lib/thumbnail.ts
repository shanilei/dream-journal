// Converts a Supabase Storage public object URL into a transformed,
// resized variant via Supabase's on-the-fly Image Transformations.
// The original object in storage is never modified — this only changes
// which rendering of it is requested at read time.
const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export function toGalleryThumbnailUrl(url: string): string {
  if (!url.includes(OBJECT_PATH)) return url;
  const transformed = url.replace(OBJECT_PATH, RENDER_PATH);
  const separator = transformed.includes("?") ? "&" : "?";
  return `${transformed}${separator}width=320&quality=70&format=webp`;
}
