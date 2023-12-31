import translate from '@iamtraction/google-translate';
import fs from 'fs/promises';
import path from 'path';

async function readFileText(filename) {
  try {
    const data = await fs.readFile(filename, { encoding: 'utf8' });

    return data;
  } catch (err) {
    console.log(err);
  }
}

async function translateToHebrew(text) {
  try {
    const res = await translate(text, { from: 'en', to: 'iw' });
    return res.text;
  } catch (err) {
    console.error(err);
  }
}

async function saveTextFile(content, filename) {
  try {
    await fs.writeFile(filename, content);
  } catch (err) {
    console.log('on save text file', err);
  }
}

const findByExtension = async (dir, ext) => {
  const matchedFiles = [];

  const files = await fs.readdir(dir);

  for (const engName of files) {
    const fileInfo = path.parse(engName);

    if (fileInfo.ext === `.${ext}`) {
      const hebName = `${fileInfo.name}.heb.${ext}`;
      // console.log(hebName)
      matchedFiles.push({ eng: engName, heb: hebName });
    }
  }

  return matchedFiles;
};

async function translateFile(dir, sourceFile, targetFile) {
  const sourceText = await readFileText(`${dir}/${sourceFile}`);
  console.log({ sourceText });
  const translatedText = await translateToHebrew(sourceText);
  console.log({ translatedText });
  await saveTextFile(translatedText, `${dir}/${targetFile}`);
}

async function getFolderPath() {
  // get folder name from command line
  const [, , folder] = process.argv;
  if (!folder) {
    console.error('Please input add folder you want to translate');
    exit();
  }
  const absolutePath = path.resolve(process.cwd(), folder);

  try {
    const stat = await fs.lstat(absolutePath);
    if (!stat.isDirectory()) {
      console.error(`This is Not Directory: ${folder}`);
    }
  } catch (err) {
    console.error(err);
  }

  console.log(absolutePath);
  return absolutePath;
}

async function run() {
  const folderPath = await getFolderPath();
  console.log('Translate all srt files in folder: \n', folderPath);
  const srtFiles = await findByExtension(folderPath, 'srt');
  for (const file of srtFiles) {
    console.log(file.eng, file.heb);
    await translateFile(folderPath, file.eng, file.heb);
    console.log(`translate: ${file.heb}`);
  }
}

run();
