const express = require("express")
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
})

app.get("/", (req, res) => {
  res.json({ status: "BeatMyBag API Running!" })
})

app.post("/api/auth/magic-link", (req, res) => {
  res.json({ token: "fake-token-" + Date.now() })
})

app.listen(PORT, () => {
  console.log("Server on port " + PORT)
})
