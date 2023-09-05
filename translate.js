const translate = require('@iamtraction/google-translate');
const fs = require('fs/promises');
const path = require('path');

async function readFileText(filename) {
  try {
    const data = await fs.readFile(filename, { encoding: 'utf8' });

    return data
  } catch (err) {
    console.log(err);
  }
}

async function translateToHebrew(text) {
  try {
    const res = await translate(text, { from: 'en', to: 'iw' })
    return res.text
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
    const fileInfo = path.parse(engName)

    if (fileInfo.ext === `.${ext}`) {
      const hebName = `${fileInfo.name}.heb.${ext}`
      // console.log(hebName)
      matchedFiles.push({ eng: engName, heb: hebName });
    }
  }

  return matchedFiles;
};

async function translateFile(dir, sourceFile, targetFile) {
  const sourceText = await readFileText(`${dir}/${sourceFile}`)
  const translatedText = await translateToHebrew(sourceText)
  await saveTextFile(translatedText, `${dir}/${targetFile}`)
}

async function getFolderPath() {
  // get folder name from command line
  const [ , , folder ] = process.argv;
  if (!folder) {
    console.error("Please input add folder you want to translate")
    exit()
  }
  const absolutePath = path.resolve(process.cwd(), folder)

  try {
    const stat = await fs.lstat(absolutePath);
    if (!stat.isDirectory()) {
      console.error(`This is Not Directory: ${folder}`)
    }
  } catch (err) {
    console.error(err)
  }

    console.log(absolutePath)
  return absolutePath
}

async function run() {
  const folderPath = await getFolderPath()
  console.log("Translate all srt files in folder: \n", folderPath)
  const srtFiles = await findByExtension(folderPath, 'srt')
  for (const file of srtFiles) {
    await translateFile(folderPath, file.eng, file.heb)
    console.log(`translate: ${file.heb}`)
  }
}

function isTimeLine(text) {
  return  text.search(/\d\d:\d\d:\d\d/) === 0
}

function isEndOfSentence(text) {
  return text.search(/[.?!]$/) > 0 
}

//run()


class JoinedLines {
  constructor() {}

  get joined() {
    return this.joinedLines
  }

  async parseFile(filename) {
    this.lines = []
    this.joinedLines = null
    const text = await readFileText(filename)
    this.fileLines = text.split('\r\n')
    this.parse()
    this.creatCleanObjectForTranslation()
  }

  async creatCleanObjectForTranslation() {
    let text = ''
    this.lines.forEach(object => { 
      text += object.line + '\r\n'
    })

    const translatedString = await translateToHebrew(text)

    let index = 0 
    const traslatedLines = translatedString.split('\r\n')
    this.lines.forEach(object => { 
      object.translated = traslatedLines[index++]
    })

    console.log(this.lines)
    const fileToJSON = JSON.stringify(this.lines, null, 2)
    await saveTextFile(fileToJSON, 'temp/translatedFile.json')
  }

  addRegular(line, time) {
    const obj = {
      type: 'regular',
      time: time,
      line: line,
    }
    this.lines.push(obj)
  }
      
  add(line, time) {
    if (this.joinedLines) {
      this.joinedLines.lines.push(line)
      this.joinedLines.times.push(time)
      this.joinedLines.line += ' ' + line
    } else {
      this.joinedLines = {
        type: 'connected',
        times: [time],
        lines: [line],
        line: line
      }
    }
  }

  addAndClose(line, time) {
    this.joinedLines.lines.push(line)
    this.joinedLines.times.push(time)
    this.joinedLines.line += ' ' + line

    this.lines.push(this.joinedLines)
    
    this.joinedLines = null
  }

  parse() {
    let index = 0
    while(index < this.fileLines.length) {
      let line = this.fileLines[index++]
      let time
       
      if (isTimeLine(line)) {
        time = line
        line = this.fileLines[index++]
        if (isEndOfSentence(line)) {
          if (this.joined) {
            this.addAndClose(line, time)
          } else {
            this.addRegular(line, time)
          }
        } else {
          this.add(line, time)
        }
      }
    }
  }
}

class CreateTranslatedFile {
  constructor(filenameToSave) {
    this.filenameToSave = filenameToSave
  }

  async saveFile() {
    await saveTextFile(this.translatedContent, this.filenameToSave)
  }

  async parseLines(tempLines) {
    this.lines =  tempLines

    this.translatedContent = ''
    this.index = 1
    this.lines.forEach(obj => {
      if (obj.time) {
        this.addLine(obj.time, obj.translated)
      } else if (obj.times) {

        obj.translatedLines = []
        let translatedWords = this.getWords(obj.translated)
        obj.times.forEach((time, index) => {
            const isLast = (parseInt(index) + 1) == obj.times.length
            //console.log('islast', isLast,index,  index + 1, obj.times.length)
            if (isLast) {
              const line = this.getStrFromWordsArray(translatedWords)
              //console.log({isLast: line})
              this.addLine(time, line)
              obj.translatedLines.push(line)
            } else {
              const wordsCount = this.countWords(obj.lines[index])
              //console.log(wordsCount)
              const res = this.getLineByWordCount(translatedWords, wordsCount)
              //console.log({res})
              const line = res[0]
              translatedWords = res[1]
              this.addLine(time, line)
              obj.translatedLines.push(line)
            }
        })
      }
    })
    console.log(this.translatedContent)
    this.saveFile()
  }

  countWords(str) {
    return this.getWords(str).length;
  }

  getWords(str) {
    return str.trim().split(/\s+/);
  }

  getLineByWordCount(wordsArray, count) {
    console.log({wordsArray})
    const wordsForLine = wordsArray.splice(0, count - 1)
    const line = this.getStrFromWordsArray(wordsForLine)
    console.log({wordsForLine})
    console.log({wordsArray})

    return [line, wordsArray]
  }

  getStrFromWordsArray(arr) {
    return arr.join(' ')
  }

  addLine(time, line) {
      this.translatedContent += `${this.index++}\n\r${time}\n\r${line}\n\r`
  }
}

async function connect() {
  const filename = "./002-flex-direction.srt"

  const joinedLines = new JoinedLines()
  await joinedLines.parseFile(filename)

  console.log(joinedLines.lines)
}

async function test() {
  const text = await readFileText('./temp/translatedFile.json')
  console.log(text)
  const translatedObj = JSON.parse(text)
  //const translatedObj = tempWords

  const filename = './temp/saved.heb.srt'
  const aa = new CreateTranslatedFile(filename)
  await aa.parseLines(translatedObj)
  console.log(translatedObj)
}

//connect()



// line = '00:00:01,100 --> 00:00:07,970'
// //line = '23'
// const result = line.search(/\d\d:\d\d:\d\d/)

// endWithPeriod = 'And this is the sort of :default HTML flow!'
// const result = endWithPeriod.search(/[.?!]$/)
// console.log(result)

const tempWords = [
  {
    "type": "regular",
    "time": "00:00:00,500 --> 00:00:01,100",
    "line": "Hey, guys.",
    "translated": "היי, חבר'ה."
  },
  {
    "type": "connected",
    "times": [
      "00:00:01,100 --> 00:00:07,970",
      "00:00:07,970 --> 00:00:12,400"
    ],
    "lines": [
      "So in the last lesson, we saw how Flexbox can be declared on a container and how it can start already",
      "doing its thing based on the automatic default values."
    ],
    "line": "So in the last lesson, we saw how Flexbox can be declared on a container and how it can start already doing its thing based on the automatic default values.",
    "translated": "אז בשיעור האחרון, ראינו כיצד ניתן להכריז על Flexbox על קונטיינר וכיצד היא יכולה להתחיל כבר לעשות את שלה בהתבסס על ערכי ברירת המחדל האוטומטיים."
  },
]

test()
