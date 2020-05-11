// Import Face Reco Lib
import * as faceapi from 'face-api.js'
import { canvas, faceDetectionNet, faceDetectionOptions, saveFile } from './commons'

// File system
const fs = require('fs')
const path = require('path')

// Define Date Requested
let rootFolder = "./scraper/"
let outputFolder = "./output/"

// Get Today$
const req_date = today()

// Flags * time related
const insLocations = ['barkinganddagenham',
'barnet', 'brent', 'bromley', 'camden', 'cityoflondon', 'croydon', 'ealing', 'enfield', 'greenwichlondon', 'hackney'
, 'hammersmithandfulham', 'haringey', 'havering', 'hillingdon', 'hounslow'
, 'islington', 'kensingtonandchelsea', 'kingstonuponthames', 'lambeth', 'lewisham',
'merton', 'newham', 'redbridge', 'richmonduponthames', 'southwark', 'sutton',
'towerhamlets', 'walthamforest', 'wandsworth', 'westminster']
const insLimit = 200 

// Create if folder doesn't existed
manageFloder(rootFolder + req_date)
manageFloder(outputFolder + req_date)

let getAllArea = function () {
  let str = ""
  for(let i=0; i<insLocations.length; i++){
    str = str + insLocations[i] + " "
  }
  return str
}

let execLine = "cd " 
              + rootFolder+req_date 
              + " && " 
              + "instagram-scraper --tag " 
              + getAllArea() 
              + "--media-types image --maximum " 
              + insLimit 
              + " --latest-stamps " 
              + req_date


runScript(execLine) // run with scraper
//run(req_date) // run without scraper(data existed)

function runScript(cmd: string){
  let child = require('child_process').exec(cmd)
  child.stdout.pipe(process.stdout)
  child.on('exit', function() {
    console.log("start")
    run(req_date)
  })
}



// Reconized
async function run(date: string) {

  await faceDetectionNet.loadFromDisk('./weights')
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights')
  await faceapi.nets.faceExpressionNet.loadFromDisk('./weights')

  const readFileDirArray: any[] = []

  insLocations.forEach(element => {

    let folderPath = rootFolder + date + `/${element}`
    let readFileDir = fs.readdirSync(folderPath).filter((fileName: string) => {
      return fileName != ".DS_Store" && fileName.slice(-4) != '.mp4';
    }).map((fileName: any) => {
      const fullPath = path.join(folderPath, fileName)
      return fullPath
    })

    // return readFileDirArray
    readFileDirArray.push(readFileDir)
    return readFileDirArray

  })
  // console.log(readFileDirArray[0].length)


  
  // WARNING: MEMORY LEAK POSSIBLE IN SMALL MEMORY DEVICES
  var dataAll: any[] = []

  try {
    for (let j = 0; j < insLocations.length; j++) {

      dataAll[j] = []
      
      // Read all images
      for (let i = 0; i < readFileDirArray[j].length; i++) {
        let data = {};
        let img = await canvas.loadImage(`${readFileDirArray[j][i]}`)
        let results = await faceapi.detectAllFaces(img, faceDetectionOptions)
          .withFaceExpressions()


        // If has face
        if (results.length !== 0) {
          const out = faceapi.createCanvasFromMedia(img) as any
          faceapi.draw.drawDetections(out, results.map(res => res.detection))
          faceapi.draw.drawFaceExpressions(out, results)

          if (!fs.existsSync(outputFolder + date + "/" + insLocations[j])){
            // If does not existed create a new folder
            fs.mkdirSync(outputFolder + date + "/" + insLocations[j])
          }

          saveFile(outputFolder + date + `/${insLocations[j]}/${i}.jpg`, out.toBuffer('image/jpeg'))
          console.log(`done, saved results to out ` + outputFolder + date + `/${insLocations[j]}/${i}.jpg`)
        }

        // So no face than do nothing..

        // Save Results
        results.forEach(el => {
          data['id'] = `${i}`
          data['FaceExpressions'] = el.expressions
          dataAll[j].push(data)

        })
      }

    }
  } catch (error) {
    console.log("err", error);
  }

  // Generate Data File
  for (let i = 0; i < insLocations.length; i++) {
    let content = JSON.stringify(dataAll[i]);
    let jsonFile = path.join(__dirname, outputFolder + date + `/${insLocations[i]}.json`);
    fs.writeFile(jsonFile, content, function (err: any) {
      if (err) {
        return console.log(err);
      }
      console.log(`${insLocations[i]} json file succeed!`)
    });
  }
}

// Get Today
function today(){
  let d = new Date()
  return (d.getFullYear()).toString() + addZero(d.getMonth()+1) + (d.getDate()).toString()
}


// Add an zero if mouth and date number less than 10, Num -> String
function addZero(num: number){
  return num < 10 ? "0"+(num).toString() : num.toString()
}

// If folder non existed created, or clean (Unlink not work so well in Windows)
function manageFloder(path: string){

  if (!fs.existsSync(path)){
    // If does not existed create a new folder
    fs.mkdirSync(path)
  } else {

    // Else clean it
    fs.readdir(path, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        fs.unlink(path + '/' + file, err => {
          if (err) throw err;
        })
      }
    })
  }

}