#!/usr/bin/env node
const { resolve } = require('path');
const os = require('os');
const { existsSync, readFileSync, writeFileSync} = require('fs');
const { program } = require('commander');
const glob = require('glob');
const inquirer = require('inquirer');
const chalk = require("chalk");
const {emptyDirSync, ensureDirSync} = require("fs-extra");
const { searchWords } = require('./export-book.js');
const excel2json = require('./excel2json.js');
const { parseExcel, writeExcel } = require('./excel/index.js')
const { updateSyllableRow } = require('./syllable/index.js');
const {syllablesMaps, untreated, syllableOnline} = require("./export-book");
// 获取用户家目录
const USER_HOME = process.env.HOME || process.env.USERPROFILE
// 工作目录
const workDir = resolve(USER_HOME, 'cache-search-cli');
ensureDirSync(workDir);
const cacheJson = resolve(workDir, './fans.cli.cache.json')


program
    .command('search')
    .description('查询课本中的单词数据')
    .option('-m, --map <map>', '指定默认已经分词的excel文件')
    .option('-o --output <output>', '指定分完词后输出文件夹位置')
    .action(async ({ map ,output }) => {
        let base = 'D:/Up366TeacherCache/flipbooks';
        if (os.platform() === 'darwin') {
            base = resolve(USER_HOME, './flipbooks')
        }
        console.log(chalk.cyan(`\n 查找根路径: ${base}\n`));
        const paths = glob.sync(`${base}/*`);
        if (!paths.length) {
            console.log(chalk.red(`> 没有扫描到课本 \n> 查找根路径: ${base}`))
            return;
        }
        // 搜索到课本路径
        const { books } = await inquirer.prompt([
            {
                type:"checkbox",
                message:"请选择课本：",
                name:"books",
                choices: paths,
                pageSize: 5
            }
        ]);

        let outDir = USER_HOME;
        if (output) {
            outDir = resolve(process.cwd(), output);
        }
        /// 查询课本中的单词
        const words = await searchWords(books);

        return;
        /// 查询分词缓存字典（excel文件）
        const { cache, excel } = syllablesMaps(map ? resolve(process.cwd(), map) : '');
        /// 查询需要做分词的单词列表
        // const needSyllableWords = untreated(words, cache)
        const needSyllableWords = ['hello']
        if (!needSyllableWords.length) {
            console.log('没有需要分词的数据')
            return;
        }
        /// 在线分词
        const result = await syllableOnline(needSyllableWords);

        /// 将需要人工确认的分词信息写入到文件导出
        const needCheck = []
        Object.keys(result).forEach(item => {
            needCheck.push([item, result[item]])
        })
        const buffer = [...needCheck ,...excel]
        const outputFile = output ? resolve(process.cwd(), output, 'updated-all-words.xlsx') : resolve(workDir, 'updated-all-words.xlsx');
        writeExcel(outputFile, buffer);
    })
program
    .command('update')
    .description('更新分词文件')
    .option('-i, --input <input>', '输入需要更新的分词表')
    .option('-o, --output <output>', '指定要输出的路径')
    .action(({ input, output } = {}) => {
        if (!input) {
            throw  new Error('请指定导入需要更新的分词表')
        }
        const inputFile =  input ? resolve(process.cwd(), input) : resolve(workDir, 'updated-all-words.xlsx');
        const outputFile = output ? resolve(process.cwd(), output, 'updated-all-words.xlsx') : resolve(workDir, 'updated-all-words.xlsx');
        const list = parseExcel(inputFile)
        const result = list.map(updateSyllableRow)
        writeExcel(outputFile, result);
})

program
    .command('generate')
    .description('生成趣课堂要使用的json数据')
    .option('-i, --input <input>', '输入要解析的资源路径')
    .option('-o, --output <output>', '指定要输出的路径')
    .action(({ input, output } = {}) => {
        const inputFile = resolve(__dirname, 'cache/cache.xlsx');
        const outputFile = output ? resolve(process.cwd(), output, 'syllables-words-map.json') : resolve(__dirname, 'cache/cache.xlsx');
        const list = parseExcel(inputFile)
        const map = {}
        list.forEach(([word, syllables, check]) => {
            if (check === '已校验') {
                map[word] = syllables.split(',')
            }
        })
        writeFileSync(outputFile, JSON.stringify(map))
        console.log(chalk.green(`\n\n   生成成功：${outputFile}\n`))
})
program.parse(process.argv);

