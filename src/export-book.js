const glob = require('glob');
const {resolve} = require("path");
const {readFileSync, writeFileSync, existsSync} = require("fs");
const { emptyDirSync, copySync, ensureDirSync } = require('fs-extra');
const syllable = require('./syllable.js');
const chalk = require("chalk");

module.exports = function (path, target) {
    console.log(`${path}/*/page1.js`)
    glob(`${path}/*/page1.js`, function (error, files) {
        if (error) {
            return void 0;
        }
        // 导出目录准备
        let exportDir = resolve(__dirname, './temp');
        if (target) {
            exportDir = target;
        }
        console.log('exportDir', exportDir)
        if (existsSync(exportDir)) {
            emptyDirSync(exportDir)
        } else {
            ensureDirSync(exportDir)
        }
        const template = resolve(__dirname, './export-word/index.html');
        // let all = [];
        files.forEach(file => {
            // 读取文件数据
            const data  = readFileSync(file);
            // 获取文件的pageID
            const pageIdReg = /"pageId":"(\S+?)"/g
            let pageId = '';
            data.toString().replace(pageIdReg, (match, p1) => {
                pageId = p1
            })
            // 获取文件的单词列表
            const list = []
            const reg = /"content_en":"(\S+?)"/g;
            data.toString().replace(reg, (match, p1) => {
                list.push(p1)
            })
            const output = list.map(item => {
                return {
                    word: item,
                    syllable: syllable(item),
                }
            })
            ensureDirSync(resolve(exportDir, pageId));
            const dest = resolve(exportDir, pageId);
            writeFileSync(resolve(dest, `index.js`), `var data = ${JSON.stringify(output, null, 2)}`);
            writeFileSync(resolve(dest, `index.txt`), '');
            copySync(template, resolve(dest, 'index.html'))

            console.log(chalk.blue(`\n 生成页面数据成功，ID: ${pageId}`))
        })

        console.log(chalk.green(`\n\n 生成文件成功，路径：${exportDir} \n\n   1.打包该文件提供给产品进行编辑使用 \n\n`))

    })
}
