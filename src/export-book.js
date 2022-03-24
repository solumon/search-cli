const glob = require('glob');
const {resolve} = require("path");
const {readFileSync, writeFileSync, existsSync} = require("fs");
const { emptyDirSync, copySync, ensureDirSync } = require('fs-extra');
const syllable = require('./syllable.js');
const chalk = require("chalk");
const json2excel = require('./json2excel');

const USER_HOME = process.env.HOME || process.env.USERPROFILE
// 工作目录
const workDir = resolve(USER_HOME, 'cache-search-cli');
ensureDirSync(workDir);
const cacheJson = resolve(workDir, 'fans.cli.cache.json')


/**
 * 在线分词
 * @param words 需要分词的单词列表
 * @param cache 已经分词的缓存字典
 * */
const syllableOnline = async (words, cache) => {

    let total = {};
    for (let word of words) {
        if (!cache[word]) {
            const syllables = await syllable(word)
            total[word] = syllables;
            console.log(chalk.yellow(`\n『word: ${word} syllables: ${JSON.stringify(syllables)}`))
        }
        if (Object.keys(total).length === 3) {
            cache = Object.assign(cache, total);
            writeFileSync(cacheJson, JSON.stringify(cache));
            console.log(chalk.green(`\n『持久化分词信息路径到：${cacheJson}`))
            total = {};
        }
    }
    if (Object.keys(total).length > 0) {
        cache = Object.assign(cache, total);
        writeFileSync(cacheJson, JSON.stringify(cache));
        console.log(chalk.green(`\n『持久化分词信息路径到：${cacheJson}`))
        total = {};
    }
    return void 0;
}

/**
 *  根据缓存查询需要在线分词的单词列表
 *  @param cache 缓存列表
 * */
const searchUnInquired = async (cache) => {
    // 根据分词缓存和所有的课本单词查询需要在线分词的单词
    const list = glob.sync(resolve(workDir, `data/*/index.json`));
    let unInquired = [];
    for (const listElement of list) {
        const wordsStr = readFileSync(listElement).toString()
        const words = JSON.parse(wordsStr);
        for (const [index, word] of words.entries()) {
            if (!cache[word]) { // 分词缓存中不存在
                unInquired.push(word);
            }
        }
    }
    return unInquired;
}
module.exports = function (path, exportDir) {

    /// 分词字典
    let cache = {};
    const cacheFile = resolve(workDir, './fans.cli.cache.json');
    try {
        cache = JSON.parse(readFileSync(cacheFile).toString())
    } catch (e) {
        writeFileSync(cacheFile, '{}');
        cache = {};
    }
    console.log(chalk.green(`\n『分词字典：${Object.keys(cache).length}个\n`));
    glob(`${path}/*/page1.js`, async function (error, files) {
        console.log(`[file数量: ${files.length}] >>>`)
        if (error) {
            return void 0;
        }
        /// 读取课本page1 生成单词缓存中间文件
        for (let file of files) {
            console.log(`[读取文件 ${file} 中] >>>`)
            const id = file.split('/').slice(-2)[0];
            // 读取文件数据
            const data  = readFileSync(file);
            // 获取文件的单词列表
            const list = []
            const reg = /"content_en":"(\S+?)"/g;
            data.toString().replace(reg, (match, p1) => {
                const p = p1.replace(/\([\s\S]+\)/g, '')
                const wordList = p.split('/')
                wordList.forEach((word) => {
                    list.push(word)
                })
            })
            const dataDir = resolve(workDir, 'data');
            ensureDirSync(resolve(dataDir, id));
            ///  ~/cache-search-cli/data/xxx
            const dest = resolve(dataDir, id);

            writeFileSync(resolve(dest, `index.json`), JSON.stringify(list))
        }
        /// 查询缓存中没有分词的单词列表后续使用在线分词
        const unInquired = await searchUnInquired(cache);
        if (!unInquired.length) {
            console.log(chalk.green(`\n『需要分词列表为空, 不需要在线分词\n`))
        } else {
            console.log(chalk.green(`\n『查询需要分词列表结束:${unInquired.length}个\n`))
            /// 在线分词
            const result = await syllableOnline(unInquired, cache)
            console.log(chalk.green('\n『在线处理分词列表结束\n'))
        }

        /// 根据缓存生成要导出的列表
        const exDir = resolve(exportDir, 'export-search-cli');
        ensureDirSync(exDir)
        const list = glob.sync(resolve(workDir, `data/*/index.json`));
        let all = {};
        list.forEach(item => {
            const id = item.split('/').slice(-2)[0]
            const wordsStr = readFileSync(item).toString()
            const words = JSON.parse(wordsStr);
            let map = {}
            words.forEach(word => {
                map[word] = cache[word];
            })
            Object.assign(all, map);
            ensureDirSync(resolve(exDir, id))
            const fileName = resolve(exDir, `${id}/words.xlsx`)
            json2excel(fileName, map)
        })
        const fileName = resolve(exDir, `all.xlsx`);
        json2excel(fileName, all)
        console.log(chalk.green(`\n『生成文件成功，路径: ${exDir} \n   1.打包该文件提供给产品进行编辑使用 \n`))
    })
}
