const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  drawings: {
    type: Array,
    default: [],
  },
});

exports.Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);