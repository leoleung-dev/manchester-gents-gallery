export default {
  name: 'comment',
  type: 'document',
  title: 'Comment',
  fields: [
    { name: 'name', type: 'string', title: 'Name' },
    { name: 'instagram', type: 'string', title: 'Instagram' },
    { name: 'message', type: 'text', title: 'Message' },
    {
      name: 'photo',
      type: 'reference',
      to: [{ type: 'photo' }],
      title: 'Linked Photo'
    },
    {
      name: 'createdAt',
      type: 'datetime',
      title: 'Created At',
      initialValue: () => new Date().toISOString()
    }
  ]
}
