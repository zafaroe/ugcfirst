const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Get arguments: node trim-single-video.js <filename> <frames_to_skip>
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node trim-single-video.js <filename> <frames_to_skip>');
  console.log('Example: node trim-single-video.js bottle-review.mp4 30');
  process.exit(1);
}

const filename = args[0];
const framesToSkip = parseInt(args[1]);
const videosDir = path.join(__dirname, '../public/videos/hero');
const inputPath = path.join(videosDir, filename);
const tempPath = path.join(videosDir, `temp_${filename}`);

if (!fs.existsSync(inputPath)) {
  console.log(`File not found: ${inputPath}`);
  process.exit(1);
}

console.log(`Trimming ${framesToSkip} frames from ${filename}...`);

ffmpeg(inputPath)
  .videoFilters([
    `select='gte(n,${framesToSkip})'`,
    'setpts=PTS-STARTPTS'
  ])
  .audioFilters([
    `aselect='gte(n,${framesToSkip})'`,
    'asetpts=PTS-STARTPTS'
  ])
  .outputOptions(['-c:v', 'libx264', '-c:a', 'aac'])
  .on('start', () => console.log('Processing...'))
  .on('end', () => {
    fs.unlinkSync(inputPath);
    fs.renameSync(tempPath, inputPath);
    console.log(`Done! Trimmed ${framesToSkip} frames (${(framesToSkip/30).toFixed(2)}s at 30fps)`);
  })
  .on('error', (err) => {
    console.error('Error:', err.message);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  })
  .save(tempPath);
