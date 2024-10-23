const abbreviations = require("./abbreviations");
const fs = require("fs");
const readlineSync = require("readline-sync");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const artist = "Carbon Leaf";
console.log("** FORMAT: YYYY-MM-DD City - Venue **");
const albumName = readlineSync.question("Album Title: ");
// prompt for album name

function makeTitle(abbr) {
  const split = abbr.toUpperCase().split("_U");
  const unplugged = split.length > 1 ? " (unplugged)" : "";
  const key = split[0];

  if (abbreviations[key]) {
    return abbreviations[key] + unplugged;
  }
  const manualTitle = readlineSync.question(
    `Title not found for ${abbr}. Input title below: `,
  );
  return manualTitle;
}

const path = "../../desktop/CLUSB All";
const srcDir = `${path}/- metadata working`;
const destinationALAC = `${srcDir}/ALAC - ${albumName}`;
const destinationMP3 = `${srcDir}/${albumName}`;

fs.existsSync(destinationALAC) &&
  fs.rmSync(destinationALAC, { recursive: true, force: true });
fs.mkdirSync(destinationALAC);
fs.existsSync(destinationMP3) &&
  fs.rmSync(destinationMP3, { recursive: true, force: true });
fs.mkdirSync(destinationMP3);

const mappings = fs
  .readdirSync(srcDir)
  .filter((filename) => filename.includes(".wav"))
  .map((filename) => {
    const [name, ext] = filename.split(".");
    // throw an error if ext is not .wav
    const [track, abbr] = name.split(" ");
    const title = makeTitle(abbr);
    return { filename, track, title };
  });

const trackCount = mappings.length;

mappings.forEach(({ filename, track, title }) => {
  ffmpeg(`${srcDir}/${filename}`)
    .audioCodec("alac")
    .outputOptions(
      "-metadata",
      `artist=${artist}`,
      "-metadata",
      `album=${albumName}`,
      "-metadata",
      `title=${title}`,
      "-metadata",
      `track=${track}/${trackCount}`,
    )
    .output(`${destinationALAC}/${track} ${title}.m4a`)
    .on("end", () => console.log("ALAC -", title, "- done "))
    .on("error", (error) => console.log("ERROR - ", "alac -", title, error))
    .run();
});

mappings.forEach(({ filename, track, title }) => {
  ffmpeg(`${srcDir}/${filename}`)
    .toFormat("mp3")
    .audioBitrate(128) // 64kbps bitrate led to calculating double-length duration values
    .outputOptions(
      "-metadata",
      `artist=${artist}`,
      "-metadata",
      `album=${albumName}`,
      "-metadata",
      `title=${title}`,
      "-metadata",
      `track=${track}/${trackCount}`,
    )
    .output(`${destinationMP3}/${track} ${title}.mp3`)
    .on("end", () => console.log("mp3 -", title, "- done "))
    .on("error", (error) => console.log("ERROR - ", "mp3 -", title, error))
    .run();
});


console.log(`\n \n SET LIST \n \n`)
mappings.forEach(({ filename, track, title }) => {
  console.log(`${track} ${title}`)
})

console.log(`\n \n`)
