import { notes } from './_notes'

export async function get(req) {
  const { slug } = req.params

  const sortedNotes = Object.keys(notes).map(key => notes[key])
  const note = sortedNotes.find(note => note.slug === slug)

  return {
    body: { note },
  }
}