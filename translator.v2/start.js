import { getFolderPath, findByExtension } from './helpers.js';
import SrtParser from './srt-parser.js';
import LineTranslator from './lines-translator.js';

async function fullRun() {
  const folderPath = await getFolderPath();
  console.log('Translate all srt files in folder: \n', folderPath);
  const srtFiles = await findByExtension(folderPath, 'srt');
  for (const file of srtFiles) {
    console.log('files', folderPath, file);
    const srtParser = new SrtParser();
    await srtParser.parseFile(file.eng);
    console.log('joined', srtParser.lines);

    const lineTranslator = new LineTranslator();
    await lineTranslator.run(srtParser.lines);
    await lineTranslator.saveFiles(file.json, file.heb);
  }
}

fullRun();
