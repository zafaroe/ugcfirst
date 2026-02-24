const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const videosDir = path.join(__dirname, '../public/videos/hero');
const videos = ['skincare-ad.mp4', 'tech-review.mp4', 'fashion-haul.mp4'];

videos.forEach(video => {
  const inputPath = path.join(videosDir, video);

  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    if (err) {
      console.log(`Error reading ${video}:`, err.message);
      return;
    }

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    if (videoStream) {
      console.log(`\n=== ${video} ===`);
      console.log(`Duration: ${metadata.format.duration}s`);
      console.log(`Frame rate: ${videoStream.r_frame_rate}`);
      console.log(`Total frames: ${videoStream.nb_frames || 'N/A'}`);
      console.log(`Resolution: ${videoStream.width}x${videoStream.height}`);

      // Calculate frames per second
      const [num, den] = videoStream.r_frame_rate.split('/');
      const fps = parseInt(num) / parseInt(den);
      console.log(`FPS: ${fps.toFixed(2)}`);
      console.log(`1 frame = ${(1000/fps).toFixed(2)}ms`);
      console.log(`To skip 0.5s, skip ${Math.ceil(fps * 0.5)} frames`);
      console.log(`To skip 1.0s, skip ${Math.ceil(fps * 1.0)} frames`);
    }
  });
});
