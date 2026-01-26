export function slugify(name: string, id?: string) {
  let slug = name.toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  return id ? `${slug}-${id}` : slug;
}
