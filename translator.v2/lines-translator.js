import { translateToHebrew, saveTextFile } from './helpers.js';

export default class LineTranslator {
  async run(lines) {
    this.lines = lines;
    await this.parseLines();
  }

  async saveFiles(jsonFilename, srtFilename) {
    const linesObject = JSON.stringify(this.lines, null, 2);
    console.log('linesObject', linesObject);
    console.log('translatedContent', this.translatedContent);
    await saveTextFile(linesObject, jsonFilename);
    await saveTextFile(this.translatedContent, srtFilename);
  }

  async createCleanObjectForTranslation() {
    let textToTranslate = '';
    this.lines.forEach((object) => {
      textToTranslate += object.line + '\r\n';
    });

    console.log({ textToTranslate });
    const translatedString = await translateToHebrew(textToTranslate);
    console.log({ translatedString });

    let index = 0;
    const traslatedLines = translatedString.split('\r\n');
    this.lines.forEach((object) => {
      object.translated = traslatedLines[index++];
    });
  }

  async parseLines() {
    await this.createCleanObjectForTranslation();

    this.translatedContent = '';
    this.index = 1;
    console.log('lines', this.lines);
    this.lines.forEach((obj) => {
      if (obj.time) {
        this.addLine(obj.time, obj.translated);
      } else if (obj.times) {
        obj.translatedLines = [];
        let translatedWords = this.getWords(obj.translated);
        obj.times.forEach((time, index) => {
          const isLast = parseInt(index) + 1 == obj.times.length;
          //console.log('islast', isLast,index,  index + 1, obj.times.length)
          if (isLast) {
            const line = this.getStrFromWordsArray(translatedWords);
            //console.log({isLast: line})
            this.addLine(time, line);
            obj.translatedLines.push(line);
          } else {
            const wordsCount = this.countWords(obj.lines[index]);
            //console.log(wordsCount)
            const res = this.getLineByWordCount(translatedWords, wordsCount);
            //console.log({res})
            const line = res[0];
            translatedWords = res[1];
            this.addLine(time, line);
            obj.translatedLines.push(line);
          }
        });
      }
    });
    console.log('2:translatedContent', this.translatedContent);
  }

  countWords(str) {
    return this.getWords(str).length;
  }

  getWords(str) {
    return str.trim().split(/\s+/);
  }

  getLineByWordCount(wordsArray, count) {
    console.log({ wordsArray });
    const wordsForLine = wordsArray.splice(0, count - 1);
    const line = this.getStrFromWordsArray(wordsForLine);
    console.log({ wordsForLine });
    console.log({ wordsArray });

    return [line, wordsArray];
  }

  getStrFromWordsArray(arr) {
    return arr.join(' ');
  }

  addLine(time, line) {
    this.translatedContent += `${this.index++}\n${time}\n${line}\n\n`;
  }
}
