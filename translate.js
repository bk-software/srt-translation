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
    this.parse(this.fileLines)
  }

  addRegular(line, time) {
    const obj = {
      type: 'regular',
      time: time,
      line: line,
    }
    this.lines.push(obj)
    console.log(this.lines)
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

  parse(lines) {
    let index = 0
    //console.log('parse', lines)
    while(index < lines.length) {
      let line = lines[index++]
      let time
       
      if (isTimeLine(line)) {
        time = line
        line = lines[index++]
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

async function connect() {
  const file = "./eng.srt"
  // const text = await readFileText(file)
  // const lines = text.split('\r\n')

  let joinedLines = new JoinedLines()
  //joinedLines.parse(lines)
  await joinedLines.parseFile(file)

  console.log(joinedLines.lines)
}
connect()

// line = '00:00:01,100 --> 00:00:07,970'
// //line = '23'
// const result = line.search(/\d\d:\d\d:\d\d/)

// endWithPeriod = 'And this is the sort of :default HTML flow!'
// const result = endWithPeriod.search(/[.?!]$/)
// console.log(result)
