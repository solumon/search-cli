const xlsx = require('node-xlsx');
const fs = require("fs");
const chalk = require("chalk");

function parseExcel(path, sheet = 0) {
    if (sheet >= 0) {
        const excel = xlsx.parse(path);
        if (excel.length) {
            return excel[0].data
        }
    } else {
        return parseExcel(path)
    }
}

function writeExcel(path, data, sheet = 0) {
    let buffer = null;
    if (sheet >= 0) {
        buffer = xlsx.build([
            {
                name: 'sheet1',
                data
            }
        ]);
    } else {
        buffer = xlsx.build(data);
    }

    try {
        fs.writeFileSync(path, buffer);
        console.log(chalk.green(`\n\n写入文件成功：\n\n    ${path} \n\n`))
    } catch (e) {
        console.log(chalk.red(`写入文件失败: ${e.message}`));
    }
}

module.exports = {
    parseExcel,
    writeExcel,
}
