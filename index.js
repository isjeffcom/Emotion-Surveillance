// Import Face Reco Lib
let faceapi = require('face-api.js')
let canvas = require('canvas')
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

// Get Images Lib
const fs = require('fs')
const path = require('path')

// Define Date Requested
let rootFolder = "./scraper/"
let outputFolder = "./output/"
const req_date = today()


// AI Models
const SSD_MOBILENETV1 = 'ssd_mobilenetv1'
const TINY_FACE_DETECTOR = 'tiny_face_detector'
const selectedFaceDetector = 'tiny_face_detector'

/*const folderPathArray = ['barkinganddagenham',
'barnet', 'brent', 'bromley', 'camden', 'cityoflondon', 'croydon', 'ealing', 'enfield', 'greenwichlondon', 'hackney'
, 'hammersmithandfulham', 'haringey', 'havering', 'hillingdon', 'hounslow'
, 'islington', 'kensingtonandchelsea', 'kingstonuponthames', 'lambeth', 'lewisham',
'merton', 'newham', 'redbridge', 'richmonduponthames', 'southwark', 'sutton',
'towerhamlets', 'walthamforest', 'wandsworth', 'westminster']*/

const folderPathArray = ['cityoflondon']

// If folder doesn't existed
//manageFloder(rootFolder + req_date)
//manageFloder(outputFolder + req_date)

let getAllArea = function () {
  let str = ""
  for(let i=0; i<folderPathArray.length; i++){
    str = str + folderPathArray[i] + " "
  }
  return str
}

let execLine = "cd " + rootFolder+req_date + " && " + "instagram-scraper --tag " + getAllArea() + "--media-types image --maximum 20 --latest-stamps " + req_date


//runScript(execLine)

function runScript(cmd){
  let child = require('child_process').exec(cmd)
  child.stdout.pipe(process.stdout)
  child.on('exit', function() {
    console.log("start")
    run(req_date)
  })
}

run(req_date)

// Reconized
async function run(date) {

  await faceapi.nets.tinyFaceDetector.loadFromUri('./weights')
  await faceapi.loadFaceRecognitionModel('./weights')
  await faceapi.loadFaceExpressionModel('./weights')

  const readFileDirArray = []

  folderPathArray.forEach(element => {
    let folderPath = rootFolder + date + `/${element}`
    let readFileDir = fs.readdirSync(folderPath).filter((fileName) => {
      return fileName != ".DS_Store" && fileName.slice(-4) != '.mp4';
    }).map((fileName) => {
      const fullPath = path.join(folderPath, fileName)
      return fullPath
    })

    // return readFileDirArray
    readFileDirArray.push(readFileDir)
    return readFileDirArray
  })
  // console.log(readFileDirArray[0].length)


  //get facial expression data
  var dataAll = []

  try {
    for (let j = 0; j < folderPathArray.length; j++) {
      dataAll[j] = []
      for (let i = 0; i < readFileDirArray[j].length; i++) {
        let data = {};
        let img = await canvas.loadImage(`${readFileDirArray[j][i]}`)
        let results = await faceapi.detectAllFaces(img, getFaceDetectorOptions())
                                    .withFaceExpressions()

        // console.log(results.length)

        //save face images
        if (results.length !== 0) {
          const out = faceapi.createCanvasFromMedia(img)
          faceapi.draw.drawDetections(out, results.map(res => res.detection))
          faceapi.draw.drawFaceExpressions(out, results)
          saveFile(outputFolder + date + `/${folderPathArray[j]}/${i}.jpg`, out.toBuffer('image/jpeg'))
          console.log(`done, saved results to out ` + outputFolder + date + `/${folderPathArray[j]}/${i}.jpg`)
        }

        //save results
        results.forEach(el => {
          data['id'] = `${i}`;
          data['FaceExpressions'] = el.expressions;
          // console.log(data)
          dataAll[j].push(data)

        })
      }

      // console.log(dataAll[j].length)
    }
  } catch (error) {
    console.log("err", error);
  }

  // //json file
  for (let i = 0; i < folderPathArray.length; i++) {
    let content = JSON.stringify(dataAll[i]);
    let jsonFile = path.join(__dirname, outputFolder + date + `/${folderPathArray[i]}.json`);
    fs.writeFile(jsonFile, content, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(`${folderPathArray[i]} json file succeed!`)
    });
  }
}

//run()

function today(){
  let d = new Date()
  return (d.getFullYear()).toString() + addZero(d.getMonth()+1) + (d.getDate()).toString()
}

function addZero(num){
  return num < 10 ? "0"+(num).toString() : num.toString()
}

// If non existed created, or clean
function manageFloder(path){

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

function getFaceDetectorOptions() {

    // ssd_mobilenetv1 options
    let minConfidence = 0.5

    // tiny_face_detector options
    let inputSize = 256
    let scoreThreshold = 0.5
    return selectedFaceDetector === SSD_MOBILENETV1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence })
    : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}

function getCurrentFaceDetectionNet() {

  if (selectedFaceDetector === SSD_MOBILENETV1) {
    return faceapi.nets.ssdMobilenetv1
  }
  if (selectedFaceDetector === TINY_FACE_DETECTOR) {
    return faceapi.nets.tinyFaceDetector
  }

  return false

}

function saveFile(fileName, buf) {
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir)
    }

    fs.writeFileSync(path.resolve(baseDir, fileName), buf)
}