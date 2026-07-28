/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Slug generation utility with uniqueness checking
 */

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return (
    title
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove special characters except hyphens
      .replace(/[^\w-]+/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length to 100 characters
      .substring(0, 100)
      // Remove trailing hyphen if substring cut in middle of word
      .replace(/-+$/, '')
  );
}

/**
 * Generate a unique slug by checking against existing records
 * @param {string} title - The title to convert to slug
 * @param {Function} checkExistence - Function that checks if slug exists (returns boolean)
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(
  title,
  checkExistence,
  excludeId = null,
) {
  const baseSlug = generateSlug(title);

  if (!baseSlug) {
    throw new Error('Cannot generate slug from provided title');
  }

  let slug = baseSlug;
  let counter = 1;

  // Check if base slug is unique
  while (await checkExistence(slug, excludeId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loop
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} - Whether slug is valid
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check if slug matches expected format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

/**
 * Sanitize user-provided slug
 * @param {string} slug - User-provided slug
 * @returns {string} - Sanitized slug
 */
export function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return generateSlug(slug);
}
