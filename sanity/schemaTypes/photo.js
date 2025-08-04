export default {
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    {
      name: 'eventSlug',
      title: 'Event Slug',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required(),
    },
    {
      name: 'takenAt',
      title: 'Taken At',
      type: 'datetime',
      description: 'EXIF DateTimeOriginal or fallback timestamp',
    },
    {
  name: 'createdAt',
  title: 'Created At',
  type: 'datetime',
  readOnly: true,
  hidden: true // or false if you want to show it
},

  ],
}
