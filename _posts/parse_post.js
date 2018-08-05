const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const readline = require('readline')
const async = require('async')

/* ****************************** entry *********************************** */
let basePath = __dirname
let fileNames = fs.readdirSync(basePath).filter((name) => {
  // only care those Markdown files
  return name.match(/S*.md/)
})

async.each(fileNames, (name) => {
  extractYAML(joinPath(basePath, name), (doc) => {
    console.log(doc)
    /* example doc structure
      { 
        layout: 'post',
        title: 'NP-completeness',
        subtitle: 'An introduction to NP-completeness',
        keyword: 'algorithm, NP, NPC',
        tag: [ 'algorithm' ] 
      }
    */
        
  })
})
/* ************************************************************************* */

function extractYAML(filePath, callback) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  })

  let showFirst = false
  let showSecond = false
  let isFinish = false
  let content = ""
  
  rl.on('line', (line) => {
    rl.pause()
    if (line.match(/---/) && !showFirst) {
      showFirst = true
    }
    else if (line.match(/---/) && showFirst) {
      showSecond = true
    }

    if (showFirst && showSecond && !isFinish) {
      rl.close()
      isFinish = true
      callback(parseYAML(content))
      return
    }
    else if (!isFinish) {
      content += line + "\n"
      rl.resume()
    }
  })
}

function joinPath(base, sub) {
  return path.join(base, sub)
}

function parseYAML(content) {
  try {
    let doc = yaml.safeLoad(content, 'utf-8')
    return doc
  } catch (e) {
    console.log(e)
  }
}