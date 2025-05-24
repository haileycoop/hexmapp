import axios from 'axios'
import Papa from 'papaparse'

// Use the published-to-web ID (the part after /d/e/ in your URL)
const SHEET_ID = import.meta.env.VITE_SHEET_ID

// Tab gids
const HEX_TAB_GID = '0'            // GID for sheet 1
const MOVEMENT_TAB_GID = '1502891645'  // GID for Sheet2

// Build CSV URLs
const HEX_CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${HEX_TAB_GID}&single=true&output=csv`
const MOVEMENT_CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${MOVEMENT_TAB_GID}&single=true&output=csv`

export async function fetchHexData() {
  const resp = await axios.get(HEX_CSV_URL)
  const parsed = Papa.parse(resp.data, {
    header: true,
    skipEmptyLines: true,
  })
  return parsed.data
}

export async function fetchMovementData() {
  const resp = await axios.get(MOVEMENT_CSV_URL)
  const parsed = Papa.parse(resp.data, {
    header: true,
    skipEmptyLines: true,
  })

  // Parse The Party column into discrete movement entries
  const movements = []
  for (const row of parsed.data) {
    const raw = row['The Party']
    const date = row['date']
    if (!raw || !date) continue

    const matches = raw.match(/#\d{4}[^#]*/g) || []
    for (const match of matches) {
      const hex = match.match(/#\d{4}/)?.[0] || ''
      movements.push({
        date,
        hex,
        text: match.trim(),
        faction: 'The Party' // 👈 This makes your filter in App.vue work
      })
    }
  }

  return movements
}
