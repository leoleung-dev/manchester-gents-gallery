export default {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    },
    {
      name: 'defaultCoverImage',
      title: 'Default Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image shown on home page and event previews',
    },
    // other event fields here
  ],
}
