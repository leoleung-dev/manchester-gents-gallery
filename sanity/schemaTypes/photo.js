export default {
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    {
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{ type: 'event' }],
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
      hidden: true,
    },
    {
      name: 'name',
      title: 'File Name',
      type: 'string',
      readOnly: true,
    },
  ],
}
