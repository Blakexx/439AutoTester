const fetch = require("node-fetch");
const fs = require("fs");
const extra = require("fs-extra");
const shell = require("shelljs")

let options = require("./options.json");

module.exports = {
    fetch : doFetch,
    options: options
}

//Override fs.readFile to return a Promise
fs.readFileAsync = function(filename,enc){
	return new Promise(function(resolve,reject){
		fs.readFile(filename,enc,function(err,data){
			if(err){
				reject(err);
			}else{
				resolve(data);
			}
		});
	});
}

function doFetch(){
    return new Promise((resolve,reject)=>{
        if(options["testAll"]){

            //Delete temp dir
            shell.rm("-rf","./temp");
        
            //Get files from git
            shell.exec("git clone "+options["gitUrl"]+":"+options["testGroup"]+" ./temp");
            let files = fs.readdirSync("./temp");
        
            //Remove .git file
            let index = files.indexOf(".git");
            if(index>-1){
                files.splice(index,1);
            }
        
            Promise.all(files.map(fileName=>fs.readFileAsync("./temp/"+fileName,"utf8"))).then(data=>{
                copyToProject(files,data).then(_=>{
                    //Delete temp dir
                    shell.rm("-rf","./temp");
                    resolve(files.filter(s=>s.endsWith(".cc")).map(s=>s.substring(0,s.lastIndexOf(".cc"))));
                });
            });
        
        }else{
            //Set up the requested test files
            let toFetch = [];
            options["tests"].forEach(s=>{
                toFetch.push(s+".cc");
                toFetch.push(s+".ok");
            });
        
            //Retrieve all requested tests concurrently
            Promise.all(toFetch.map(s=>fetch(options["websiteUrl"]+"/"+options["testGroup"]+"/"+s))).then(responses=>{
                //Map response to text
                return Promise.all(responses.map(response => response.status==200?response.text():null));
            }).then(data=>{
                copyToProject(toFetch,data).then(_=>{
                    resolve(options["tests"]);
                });
            });
        }
    });
}

function copyToProject(namesList, dataList){
    let numWrote = 0;
    return new Promise((resolve,reject)=>{
        //For each fetched file, write it to the project directory
        let projectPath = options["projectPath"];
        console.log("Copying tests to "+projectPath+"...");
        for(let i = 0; i<namesList.length;i++){
            let filePath = projectPath+"/"+namesList[i];
            let data = dataList[i];
            if(data!=null){
                extra.ensureFile(filePath).then(()=>{
                    fs.writeFile(filePath,data,err=>{
                        if(++numWrote==namesList.length){
                            resolve();
                        }
                    });
                });
            }else{
                if(++numWrote==namesList.length){
                    resolve();
                }
            }
        }
    });
}