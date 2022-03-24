const glob = require('glob');
const {resolve} = require("path");
const {readFileSync, writeFileSync, existsSync} = require("fs");
const { emptyDirSync, copySync, ensureDirSync } = require('fs-extra');
const syllable = require('./syllable.js');
const chalk = require("chalk");

const cache = require('../cache/cache.json') || {}
const cachePath = resolve(__dirname, '../cache')


module.exports = function (path, target) {
    glob(`${path}/*/page1.js`, async function (error, files) {
        console.log(`[file数量: ${files.length}] >>>`)
        if (error) {
            return void 0;
        }
        // 导出目录准备
        let exportDir = resolve(__dirname, './temp');
        if (target) {
            exportDir = target;
        }
        if (existsSync(exportDir)) {
            emptyDirSync(exportDir)
        } else {
            ensureDirSync(exportDir)
        }
        const template = resolve(__dirname, './export-word/index.html');
        // let all = [];
        for (let file of files) {
            console.log(`[读取文件 ${file} 中] >>>`)
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
                const p = p1.replace(/\([\s\S]+\)/g, '')
                const wordList = p.split('/')
                wordList.forEach((word) => {
                    list.push({
                        word
                    })
                })
            })
            ensureDirSync(resolve(exportDir, pageId));
            const dest = resolve(exportDir, pageId);
            writeFileSync(resolve(dest, `index.txt`), '');
            writeFileSync(resolve(dest, `index.json`), JSON.stringify(list.map(item => item.word), null, 2))
            copySync(template, resolve(dest, 'index.html'))
        }

        const list = glob.sync(`${exportDir}/*/index.json`);
        /// 查询分词过的单词
        let cache = {};
        console.log(resolve(exportDir, 'cache.json'))
        const cacheFile = resolve(exportDir, '../fans.cli.cache.json');
        try {
            cache = JSON.parse(readFileSync(cacheFile).toString())
        } catch (e) {
            writeFileSync(cacheFile, '{}');
            cache = {};
        }
        console.log(cache)
        console.log(chalk.green(`\n\n🚀已分词：${Object.keys(cache).length}个\n\n`));
        let unInquired = [];
        for (const listElement of list) {
            const wordsStr = readFileSync(listElement).toString()
            const words = JSON.parse(wordsStr);
            for (const [index, word] of words.entries()) {
                if (!cache[word]) {
                    unInquired.push(word);
                }
            }
        }
        /// 没有分词过的单词列表
        console.log(chalk.green(`🚀查询到未分词：${unInquired.length}个\n\n`))
        let total = {};
        for (let word of unInquired) {
            if (!cache[word]) {
                const syllables = await syllable(word)
                console.log(`[word: ${word}] >>>`)
                total[word] = syllables;
            }
            if (Object.keys(total).length === 10) {
                cache = Object.assign(cache, total);
                console.log(chalk.green(`🚀持久化分词信息路径到：${exportDir}/cache.json`))
                writeFileSync(cacheFile, JSON.stringify(cache));
                total = {};
            }
        }
        console.log(chalk.green('🚀分词结束😄😄😄😄😄😄😄😄😄\n\n'))


        console.log(chalk.green(`\n\n 😄😄😄生成文件成功，路径：${exportDir} \n\n   1.打包该文件提供给产品进行编辑使用 \n\n`))
    })
}
