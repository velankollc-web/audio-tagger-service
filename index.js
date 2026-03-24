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
      const coverConverted = `/tmp/cover-${Date.now()}.jpg`;

      const convertCmd = `ffmpeg -y -i "${cover.path}" "${coverConverted}"`;

      exec(convertCmd, (convertErr) => {
        if (convertErr) {
          console.warn("Cover conversion failed, will output MP3 without cover:", convertErr.message);
        }

        const coverOk = !convertErr && fs.existsSync(coverConverted);

        const cmd = coverOk
          ? `ffmpeg -y \
              -i "${audio.path}" \
              -i "${coverConverted}" \
              -map 0:a -map 1:v \
              -c copy \
              -id3v2_version 3 \
              -metadata:s:v title="Cover" \
              -metadata:s:v comment="Cover (front)" \
              "${output}"`
          : `ffmpeg -y \
              -i "${audio.path}" \
              -c copy \
              "${output}"`;

        exec(cmd, (err) => {
          // Cleanup covers dans tous les cas
          if (fs.existsSync(cover.path)) fs.unlinkSync(cover.path);
          if (fs.existsSync(coverConverted)) fs.unlinkSync(coverConverted);

          if (err) {
            console.error("FFmpeg error:", err);
            return res.status(500).json({ error: "FFmpeg error" });
          }

          res.download(output, "output.mp3", () => {
            if (fs.existsSync(audio.path)) fs.unlinkSync(audio.path);
            if (fs.existsSync(output)) fs.unlinkSync(output);
          });
        });
      });
    } catch (e) {
      console.error("Server error:", e);
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
