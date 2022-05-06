const glob = require('glob');
const {resolve} = require("path");
const {readFileSync, writeFileSync, existsSync} = require("fs");
const { emptyDirSync, copySync, ensureDirSync, removeSync} = require('fs-extra');
const syllable = require('./syllable.js');
const chalk = require("chalk");
const json2excel = require('./json2excel');
const {parseExcel} = require("./excel");

const USER_HOME = process.env.HOME || process.env.USERPROFILE
// 工作目录
const workDir = resolve(USER_HOME, 'cache-search-cli');
ensureDirSync(workDir);
const cacheJson = resolve(workDir, 'syllable.online.cache.json')


/**
 * 在线分词
 * @param words 需要分词的单词列表
 * @return {Promise} 分词后的结果
 * */
const syllableOnline = async (words) => {
    if (!words.length) return {}
    let total = {};
    let index = 0;
    if (existsSync(cacheJson)) { /// 在线分词有缓存
        total = JSON.parse(readFileSync(cacheJson).toString())
    }
    console.log(22222222)
    for (let word of words) {
        if (!total[words]) {
            const tokens = await syllable(word);
            total[word] = tokens.join(',')
            index++;
            console.log(chalk.yellow(`\n『word: ${word} syllables: ${total[word]}`))
        }

        if (index === 3) {
            writeFileSync(cacheJson, JSON.stringify(total));
            index = 0;
            console.log(chalk.green(`\n『持久化分词信息路径到：${cacheJson}`))
        }
    }
    if (index > 0) {
        writeFileSync(cacheJson, JSON.stringify(total));
        console.log(chalk.green(`\n『持久化分词信息路径到：${cacheJson}`))
    }
    removeSync(cacheJson);
    return Promise.resolve(total);
}

/**
 *  根据缓存查询需要在线分词的单词列表
 *  @param words 课本中查询到的单词列表
 *  @param cache 缓存列表
 * */
const untreated = (words ,cache) => {
    let unInquired = [];
    words.forEach(word => {
        if (!cache[word]) {
            unInquired.push(word);
        }
    })
    return unInquired;
}

function searchWords(paths) {
    console.log('paths', `(${paths.join('|')})/*/page1.js`)

    return new Promise((resolve, reject) => {
        glob(`(${paths.join('|')})/*/page1.js`, async function (error, files) {
            console.log('files', files)
            if (error) {
                reject(`路径：${path}查询失败`);
            }
            let list = [];
            /// 读取课本page1 查找到所有的需要分词的单词
            for (let file of files) {
                // 读取文件数据
                const data  = readFileSync(file);
                // 获取文件的单词列表
                const temp = []
                const reg = /"content_en":"(\S+?)"/g;
                data.toString().replace(reg, (match, p1) => {
                    const p = p1.replace(/\([\s\S]+\)/g, '')
                    const wordList = p.split('/')
                    wordList.forEach((word) => {
                        temp.push(word)
                    })
                })
                list = [...list, ...temp]
            }
            resolve(list);
        });
    })
}

function syllablesMaps(path) {
    let cacheFile = resolve(__dirname, './cache/cache.xlsx');
    if (path) {
        cacheFile = path;
    }
    const excel = parseExcel(cacheFile);
    const map = {};
    excel.forEach(item => {
        if (item.length >= 3 && item[2] === "已校验") {
            map[item[0]] = item[1];
        }
    })
    return { cache: map, excel };
}

module.exports = {
    searchWords,
    syllablesMaps,
    syllableOnline,
    untreated
}
