const glob = require('glob');
const {resolve} = require("path");
const {readFileSync, writeFileSync, existsSync} = require("fs");
const { emptyDirSync, copySync, ensureDirSync } = require('fs-extra');
const syllable = require('./syllable.js');

module.exports = function (path, target) {
    console.log(`${path}/*/page1.js`)
    glob(`${path}/*/page1.js`, function (error, files) {
        if (error) {
            return void 0;
        }
        console.log('search files success:', files)
        let all = [];
        files.forEach(file => {
            const data  = readFileSync(file);
            // console.log(data.toString())
            const list = []
            const reg = /"content_en":"(\S+?)"/g;
            data.toString().replace(reg, (match, p1) => {
                list.push(p1)
            })
            // syllable
            all = all.concat(list)
        })
        const words = Array.from(new Set(all));
        const list = words.map(item => {
            return {
                word: item,
                syllable: syllable(item),
            }
        })
        let exportDir = resolve(__dirname, '../temp');
        if (target) {
            exportDir = target;
        }
        if (existsSync(exportDir)) {
            emptyDirSync(exportDir)
        }
        const src = resolve(__dirname, '../export-word/index.html');
        const dest = resolve(resolve(exportDir, 'index.html'))
        const result = copySync(src, dest)
        writeFileSync(resolve(exportDir, 'words.json'), JSON.stringify(list, null, 2));
    })
}
