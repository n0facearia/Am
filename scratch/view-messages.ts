import { Database } from "bun:sqlite"
const db = new Database("/home/n0face/.local/share/opencode/opencode-local.db")
// Get the first complete session
const rows: any[] = db.query(`
  select json_extract(m.data, '$.role') as role, p.data 
  from part p 
  join message m on p.message_id = m.id 
  where m.session_id = 'ses_0aea09461ffeFzdcsARS4vUS15' 
  order by m.time_created, p.time_created
`).all()
for (const row of rows) {
  const data = JSON.parse(row.data)
  // Only print reasoning and tool parts (skip step-start/finish)
  if (data.type === "reasoning") {
    console.log("=== REASONING ===")
    console.log(data.text || "(empty)")
  } else if (data.type === "tool") {
    console.log(`=== TOOL: ${data.tool} ===`)
    if (data.state?.output) console.log("Output:", String(data.state.output).slice(0, 400))
    if (data.state?.error) console.log("Error:", data.state.error)
  } else if (data.type === "text") {
    console.log("=== TEXT ===")
    console.log(data.text)
  }
}
