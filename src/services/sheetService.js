// src/services/sheetService.js
import axios from 'axios'
import Papa from 'papaparse'

// Use the published-to-web ID (the part after /d/e/ in your URL)
const SHEET_ID = import.meta.env.VITE_SHEET_ID

// Build the CSV URL from that
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`

export async function fetchHexData() {
  const resp = await axios.get(CSV_URL)
  const parsed = Papa.parse(resp.data, {
    header: true,
    skipEmptyLines: true,
  })
  return parsed.data
}

