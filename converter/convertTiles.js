function getFiles(){
    let [file] = document.querySelector('input[type=file]').files;
    let fileReader = new FileReader();
    let jsonData;

    fileReader.readAsText(file);

    fileReader.addEventListener("load", () =>{
        jsonData = JSON.parse(fileReader.result);
        convertFiles(jsonData);
        console.log(jsonData);
    }, false)

}

function convertFiles(file){

}