const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "/tmp" });

app.post(
  "/tag",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const audio = req.files.audio[0];
      const cover = req.files.cover[0];

      const output = `/tmp/output-${Date.now()}.mp3`;

      const cmd = `
        ffmpeg -y \
        -i "${audio.path}" \
        -i "${cover.path}" \
        -map 0:a -map 1:v \
        -c copy \
        -id3v2_version 3 \
        -metadata:s:v title="Cover" \
        -metadata:s:v comment="Cover (front)" \
        "${output}"
      `;

      exec(cmd, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "FFmpeg error" });
        }

        res.download(output, "output.mp3", () => {
          fs.unlinkSync(audio.path);
          fs.unlinkSync(cover.path);
          fs.unlinkSync(output);
        });
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.get("/", (_, res) => {
  res.send("Audio tagger service is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
