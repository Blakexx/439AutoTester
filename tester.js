const fetcher = require("./fetcher.js");
const shell = require("shelljs");
const fs = require("fs");
const extra = require("fs-extra");
const { resolve } = require("path");

let options = fetcher.options;

function rayEqual(ray1, ray2) {
    if(ray1==null || ray2==null){
        return false;
    }
    if(ray1.length!=ray2.length){
        return false;
    }
    for(let i = 0; i<ray1.length;i++){
        if(ray1[i]!=ray2[i]){
            return false;
        }
    }
    return true;
}

function execScript(script,timeout){
    return new Promise((resolve,reject)=>{
        let process = shell.exec(script,{silent:true, timeout:timeout, fatal:true,async:true},(code,stdout,stderr)=>{
            shell.exec("pkill -f qemu-system-i38");
            resolve({stdout,stderr,code});
        });
    });
}

fetcher.fetch().then(async function(toTest) {
    console.log();
    shell.exec("rm -rf ./outputs");
    for(let testIndex = 0; testIndex<toTest.length; testIndex++){
        let testName = toTest[testIndex];
        console.log("Testing "+testName+"...");
        shell.exec("cd "+options["projectPath"]+" && make clean "+testName+".result", {silent:true});
        let expected = fs.readFileSync(options["projectPath"]+"/"+testName+".ok","utf8").replace(/\r/g,"").split("\n").filter(line=>line.startsWith("***"));
        let testFor = options["testFor"];
        let passed = 0;
        for(let test = 0; test<testFor;test++){
            const {stderr,stdout,code} = await execScript("cd "+options["projectPath"]+" && ./run_qemu",options["timeoutMs"]);
            let lines = stdout.split("\n").filter(line=>line.startsWith("***"));
            let didPass = code!=null && rayEqual(lines,expected);
            passed+=didPass?1:0;
            let testFile = "./outputs/"+testName+"/"+test+"-"+(didPass?"passed":"failed");
            await extra.ensureFile(testFile);
            fs.writeFileSync(testFile,stdout);
        }
        console.log("passed: "+(100.0*passed/testFor).toFixed(1)+"% ("+passed+"/"+testFor+")");
        if(passed!=testFor){
            let failed = testFor-passed;
            console.log("failed: "+(100.0*failed/testFor).toFixed(1)+"% ("+failed+"/"+testFor+")")
        }
        console.log();
        if (!options["retain"].includes(testName)) {
            shell.exec("rm -f " + options["projectPath"] + "/" + testName + ".cc");
            shell.exec("rm -f " + options["projectPath"] + "/" + testName + ".ok");
        }
    }
    shell.exec("cd "+options["projectPath"]+" && make clean", {silent:true});
    console.log("Go to "+__dirname+"/outputs to view specific test outputs\n");
});