import { notes } from './_notes'

export async function GET() {
  const sortedNotes = Object.keys(notes).map(key => notes[key])
  sortedNotes.sort((b, a) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    if (da < db) return -1
    if (da === db) return 0
    if (da > db) return 1
  })

  return {
    body: { notes: sortedNotes },
  }
}