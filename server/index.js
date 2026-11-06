
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to SyncSpace Backend!");
});

app.listen(5000, () => {
  console.log("SyncSpace server running on port 5000");
});

app.get("/api/health",(req, res)=>{
  res.json({status:"success",
    message: "SyncSpace API is running !"
  })
})

app.get("/api/about",(req, res)=>{
  res.json({

  "project": "SyncSpace",
  "developer": "Joseph",
  "version": "1.0.0"

  })
})