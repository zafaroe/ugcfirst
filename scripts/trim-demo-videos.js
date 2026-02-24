const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const videosDir = path.join(__dirname, '../public/videos');
const videos = [
  'demo-1-beauty.mp4',
  'demo-2-tech.mp4',
  'demo-3-fashion.mp4',
  'demo-4-fitness.mp4',
  'demo-5-kitchen.mp4'
];

// 15 frames = 0.5s at 30fps
const FRAMES_TO_SKIP = 15;

async function trimVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([
        `select='gte(n,${FRAMES_TO_SKIP})'`,
        'setpts=PTS-STARTPTS'
      ])
      .audioFilters([
        `aselect='gte(n,${FRAMES_TO_SKIP})'`,
        'asetpts=PTS-STARTPTS'
      ])
      .outputOptions(['-c:v', 'libx264', '-c:a', 'aac'])
      .on('start', () => console.log(`Processing: ${path.basename(inputPath)}`))
      .on('end', () => {
        console.log(`Done: ${path.basename(inputPath)}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error: ${path.basename(inputPath)} - ${err.message}`);
        reject(err);
      })
      .save(outputPath);
  });
}

async function main() {
  console.log(`Trimming ${FRAMES_TO_SKIP} frames (0.5s) from demo videos...\n`);

  for (const video of videos) {
    const inputPath = path.join(videosDir, video);
    const tempPath = path.join(videosDir, `temp_${video}`);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${video} - not found`);
      continue;
    }

    try {
      await trimVideo(inputPath, tempPath);
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      console.log(`Replaced: ${video}\n`);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }

  console.log('All done!');
}

main();
