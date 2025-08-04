export default {
  name: 'photo',
  type: 'document',
  title: 'Photo',
  fields: [
    { name: 'eventSlug', type: 'string', title: 'Event Slug' },
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      options: { hotspot: true }
    },
    {
      name: 'createdAt',
      type: 'datetime',
      title: 'Created At',
      initialValue: () => new Date().toISOString()
    }
  ]
}
