const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const videosDir = path.join(__dirname, '../public/videos/hero');
const videos = ['skincare-ad.mp4', 'tech-review.mp4', 'fashion-haul.mp4'];

// Number of frames to skip (15 frames = 0.5s at 30fps)
const FRAMES_TO_SKIP = 15;

async function trimFirstFrame(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Skip first N frames (0.5 seconds at 30fps)
      .videoFilters([
        `select='gte(n,${FRAMES_TO_SKIP})'`,
        'setpts=PTS-STARTPTS'
      ])
      .audioFilters([
        `aselect='gte(n,${FRAMES_TO_SKIP})'`,
        'asetpts=PTS-STARTPTS'
      ])
      .outputOptions(['-c:v', 'libx264', '-c:a', 'aac'])
      .on('start', (cmd) => {
        console.log(`Processing: ${path.basename(inputPath)}`);
      })
      .on('end', () => {
        console.log(`Done: ${path.basename(outputPath)}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error processing ${path.basename(inputPath)}:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

async function main() {
  console.log('Trimming first frame from hero videos...\n');

  for (const video of videos) {
    const inputPath = path.join(videosDir, video);
    const tempPath = path.join(videosDir, `temp_${video}`);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${video} - file not found`);
      continue;
    }

    try {
      await trimFirstFrame(inputPath, tempPath);
      // Replace original with trimmed version
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      console.log(`Replaced: ${video}\n`);
    } catch (err) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  console.log('All done!');
}

main();
