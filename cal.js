const fs = require('fs')
const conf = require('./conf')
const request = require('./request')

const dir = './all/'

let res = []


calculateAgain()
function calculateAgain(){
    let all = fs.readFileSync('./out_geo.json', 'utf-8')
    all = JSON.parse(all)

    let res = all
    

    for(let i=0;i<all.length;i++){
        let el = all[i]
        res[i].emo = el.detail.happy
        
    }

    fs.writeFileSync('./out_geo_final.json', JSON.stringify(res))
    
}

/*fs.readdir(dir, (err, files) => {

    for(let i=0;i<files.length;i++){

        let file = files[i]
        let locName = file.split('.')[0]

        let tmp = {
            name: locName,
            emo:0,
            la:0,
            lo:0,
            dict: locName
        }
        let tmpDetail = {
            neutral: 0,
            happy: 0,
            sad: 0,
            angry: 0,
            fearful: 0,
            disgusted: 0,
            surprised: 0
        }

        let el = fs.readFileSync(dir + file, 'utf-8')
        let d = JSON.parse(el)

        for(let ii=0;ii<d.length;ii++){
            let ds = d[ii].FaceExpressions

            for (const key in ds) {
                tmpDetail[key] += parseFloat((ds[key] * 100).toFixed(4))
            }
            
            tmp.emo += ((parseFloat((ds.happy * 100).toFixed(2)) + parseFloat((ds.sad * 100).toFixed(2))) ) / 2

            // If is last one 
            if(ii == d.length - 1) {
                tmp.emo = tmp.emo / d.length
                for (const key in ds) {
                    tmpDetail[key] = parseFloat((tmpDetail[key] / d.length).toFixed(4))
                }

                tmp.emo = parseFloat((tmp.emo).toFixed(4))
            }
        }

        tmp.detail = tmpDetail
        console.log("INSERTING - " + tmp.name)
        res.push(tmp)

        if(i == files.length - 1){
            fs.writeFileSync('out.json', JSON.stringify(res))
        }

        
    }

})*/

//getLocations()
async function getLocations(){

    const mapboxAPI = conf.MapboxAPI()
    const mapboxToken = conf.MapboxToken()
  
    let area = JSON.parse(fs.readFileSync('out.json', 'utf-8'))
    let arac = area

    area.forEach(async (el, idx) => {
        // If doesnt exist
        let loca = encodeURI(el.name)
        
        await request.genGet(mapboxAPI + loca + " UK" +".json", [{name: "access_token", val: mapboxToken}], (res)=>{
        
            if(res.status){

                let center = res.data.features[0].center
                
                arac[idx].lo = center[0]
                arac[idx].la = center[1]


                if(idx == area.length - 1){
                    fs.writeFileSync('out_geo.json', JSON.stringify(arac))
                }

            }
        })
        

        
    })
    
}
