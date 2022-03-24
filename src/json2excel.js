const xlsx = require('node-xlsx');
const fs = require('fs')
const chalk = require("chalk");

function json2excel(json) {
    const data = [
        {
            name: 'sheet1',
            data: [

            ]
        }
    ]
    Object.keys(json).forEach((word) => {
        const syllables = json[word] || []
        data[0].data.push([
            word,
            syllables.join(','),
        ])
    })
    return data;
}

function writeExcel(file, data) {
    const buffer = xlsx.build(data);
    // 写入文件
    fs.writeFile(file, buffer, function(err) {
        if (err) {
            console.log(chalk.red(`Write failed: ${err.message}`));
            return;
        }
        console.log(chalk.green(`Write completed : ${file}`));
    });
}

module.exports = function (file, json) {
    const data = json2excel(json)
    writeExcel(file, data)
}
