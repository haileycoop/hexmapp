// src/services/sheetService.js
import axios from 'axios'

// Use the published-to-web ID (the part after /d/e/ in your URL)
const PUBLISH_ID = '2PACX-1vSn-XvdXYEy0CVgHIkXIoQd4Pb2YfFQGLy5_4kOeu2DFcaOICW0CEQdw5QRqeusTvkJico5jFhYeo9C'

// Build the CSV URL from that
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${PUBLISH_ID}/pub?gid=0&single=true&output=csv`

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

