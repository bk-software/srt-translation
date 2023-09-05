import translate from '@iamtraction/google-translate';
import fs from 'fs/promises';
import path from 'path';

export async function readFileText(filename) {
  try {
    const data = await fs.readFile(filename, { encoding: 'utf8' });

    return data;
  } catch (err) {
    console.log(err);
  }
}

export async function translateToHebrew(text) {
  try {
    const res = await translate(text, { from: 'en', to: 'iw' });
    return res.text;
  } catch (err) {
    console.error(err);
  }
}

export async function saveTextFile(content, filename) {
  try {
    await fs.writeFile(filename, content);
  } catch (err) {
    console.log('on save text file', err);
  }
}

export async function findByExtension(dir, ext) {
  const matchedFiles = [];

  const files = await fs.readdir(dir);

  for (const engName of files) {
    // skip heb srt files
    if (engName.includes('.heb')) {
      console.log('skip:', engName);
      continue;
    }
    const fileInfo = path.parse(engName);

    if (fileInfo.ext === `.${ext}`) {
      const hebName = `${dir}/${fileInfo.name}.heb.v2.${ext}`;
      const jsonName = `${dir}/${fileInfo.name}.heb.v2.json`;

      matchedFiles.push({
        eng: `${dir}/${engName}`,
        heb: hebName,
        json: jsonName,
      });
    }
  }

  return matchedFiles;
}

export async function translateFile(dir, sourceFile, targetFile) {
  const sourceText = await readFileText(`${dir}/${sourceFile}`);
  const translatedText = await translateToHebrew(sourceText);
  await saveTextFile(translatedText, `${dir}/${targetFile}`);
}

export async function getFolderPath() {
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
