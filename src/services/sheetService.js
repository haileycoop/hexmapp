// src/services/sheetService.js
import axios from 'axios'

// Use the published-to-web ID (the part after /d/e/ in your URL)
const SHEET_ID = import.meta.env.VITE_SHEET_ID

// Build the CSV URL from that
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`

export async function fetchHexData() {
  const resp = await axios.get(CSV_URL)
  const [headerLine, ...lines] = resp.data.trim().split('\n')
  const headers = headerLine.split(',')
  return lines.map(line => {
    const cols = line.split(',')
    return headers.reduce((obj, key, i) => {
      obj[key.trim()] = cols[i].trim()
      return obj
    }, {})
  })
}

console.log('SHEET_ID:', SHEET_ID)

