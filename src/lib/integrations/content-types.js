/**
 * @typedef {Object} ContentArticle
 * @property {string} id
 * @property {string} externalId
 * @property {"payload"} source
 * @property {string} title
 * @property {string} slug
 * @property {string} excerpt
 * @property {string} image
 * @property {string} category
 * @property {string} categorySlug
 * @property {string} author
 * @property {string} authorSlug
 * @property {string} publishedAt
 * @property {string} updatedAt
 * @property {number|null} readingTime
 * @property {boolean} featured
 * @property {string} visibility
 * @property {string} url
 */

/**
 * @typedef {Object} ContentCategory
 * @property {string} id
 * @property {string} externalId
 * @property {"payload"} source
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} image
 * @property {string} visibility
 * @property {string} url
 */

export const CONTENT_SOURCES = {
  PAYLOAD: "payload",
};

export const PUBLISH_STATUSES = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};
