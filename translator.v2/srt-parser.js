import { readFileText } from './helpers.js';

export default class SrtParser {
  constructor() {}

  get lines() {
    return this.__lines;
  }

  isTimeLine(text) {
    return text.search(/\d\d:\d\d:\d\d/) === 0;
  }

  isEndOfSentence(text) {
    return text.search(/[.?!]$/) > 0;
  }

  async parseFile(filename) {
    this.__lines = [];
    this.__joinedLinesObj = null;
    const text = await readFileText(filename);
    this.fileLines = text.split('\r\n');
    await this.parse();
  }

  addRegular(line, time) {
    const obj = {
      type: 'regular',
      time: time,
      line: line,
    };
    this.__lines.push(obj);
  }

  add(line, time) {
    if (this.__joinedLinesObj) {
      this.__joinedLinesObj.lines.push(line);
      this.__joinedLinesObj.times.push(time);
      this.__joinedLinesObj.line += ' ' + line;
    } else {
      this.__joinedLinesObj = {
        type: 'connected',
        times: [time],
        lines: [line],
        line: line,
      };
    }
  }

  addAndClose(line, time) {
    this.__joinedLinesObj.lines.push(line);
    this.__joinedLinesObj.times.push(time);
    this.__joinedLinesObj.line += ' ' + line;

    this.__lines.push(this.__joinedLinesObj);

    this.__joinedLinesObj = null;
  }

  parse() {
    let index = 0;
    while (index < this.fileLines.length) {
      let line = this.fileLines[index++];
      console.log({ line });
      console.log('files line', this.fileLines);
      let time;

      if (this.isTimeLine(line)) {
        time = line;
        line = this.fileLines[index++];
        if (this.isEndOfSentence(line)) {
          if (this.__joinedLinesObj) {
            this.addAndClose(line, time);
          } else {
            this.addRegular(line, time);
          }
        } else {
          this.add(line, time);
        }
      }
    }
  }
}
