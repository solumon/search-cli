#!/usr/bin/env node
const { resolve } = require('path');
const os = require('os');
const { existsSync, readFileSync, writeFileSync} = require('fs');
const { program } = require('commander');
const glob = require('glob');
const inquirer = require('inquirer');
const chalk = require("chalk");
const {emptyDirSync, ensureDirSync} = require("fs-extra");
const exportBook = require('./export-book.js');
const excel2json = require('./excel2json.js');

// 获取用户家目录
const USER_HOME = process.env.HOME || process.env.USERPROFILE
// 工作目录
const workDir = resolve(USER_HOME, 'cache-search-cli');
ensureDirSync(workDir);
const cacheJson = resolve(workDir, './fans.cli.cache.json')


program
    .command('search')
    .description('查询课本中的单词数据')
    .option('-o --output <output>')
    .action(async ({ output }) => {
        let base = 'D:/Up366TeacherCache/flipbooks';
        if (os.platform() === 'darwin') {
            base = resolve(USER_HOME, './Desktop/flipbooks')
        }
        console.log(chalk.cyan(`\n 查找根路径: ${base}\n`));
        const paths = glob.sync(`${base}/*`);
        if (!paths.length) {
            console.log(chalk.red(`> 没有扫描到课本 \n> 查找根路径: ${base}`))
            return;
        }
        // 搜索到课本路径
        const { path: book } = await inquirer.prompt([
            {
                type:"list",
                message:"请选择课本扫描：",
                name:"path",
                prefix:"☆☆☆☆",
                suffix:"☆☆☆☆",
                choices: paths
            }
        ]);

        const target = resolve(USER_HOME, './edit-book-words');
        if (existsSync(target)) {
            emptyDirSync(target)
        } else {
            ensureDirSync(target)
        }
        let outDir = USER_HOME;
        if (output) {
            outDir = resolve(process.cwd(), output);
        }
        exportBook(book, outDir);
    })

program
    .command('import <path>')
    .description('导入excel')
    .action((path) => {
        if (!path || path.split('.').length < 2) {
            console.log(chalk.red('\n   参数有误，需要指定一个excel文件路径\n'))
            return;
        }
        let source = resolve(process.cwd(), `./${path}`);
        let target = cacheJson;
        const json = excel2json(source) || {}
        let cache
        try {
            cache = JSON.parse(readFileSync(target).toString())
        } catch (e) {
            cache = {};
        }
        Object.assign(cache, json)
        writeFileSync(target, JSON.stringify(cache));
        console.log(chalk.green(`\n『导入单词分词文件成功！\n`))
    })


program
    .command('update')
    .description('更新分词文件')
    .option('-i, --input <input>', '输入需要更新的分词表')
    .option('-o, --output <output>', '指定要输出的路径')
    .action(({ input, output } = {}) => {
        console.log('更新分词文件')
        console.log('input:', input ? resolve(process.cwd(), input) : resolve(workDir, 'words-update.xlsx'))
        console.log('output:', output ? resolve(process.cwd(), output) : resolve(workDir, 'news-words-update.xlsx'))



})

program
    .command('generate')
    .description('生成趣课堂要使用的json数据')
    .option('-i, --input <input>', '输入要解析的资源路径')
    .option('-o, --output <output>', '指定要输出的路径')
    .action(({ input, output } = {}) => {
        let source = '';
        let target = '';
        if (!input) {
            source = resolve(USER_HOME, 'edit-book-words');
        } else {
            source = resolve(process.cwd(), input)
        }
        if (!output) {
            target = resolve(USER_HOME, 'edit-book-words')
        } else {
            target = resolve(process.cwd(), target);
        }
        // 读取到修改后的页面单词数据
        const files = glob.sync(`${source}/*/index.txt`);

        let all = [];
        files.forEach(file => {
            const jsonStr = readFileSync(file).toString();
            if (jsonStr.trim().length) {
                all = all.concat(JSON.parse(jsonStr))
            }
        })
        // 去重后处理
        const words = Array.from(new Set(all.map(item => item.word)));
        all = words.map(word => all.find(item => item.word === word));
        // 替换使用输入的内容为新的分词结果
        const edited = (p1, p2) => {
            if (!p1.length || !p2.length) return false;
            if (p1.length !== p2.length) return false;
            let result = true;
            for (let i = 0; i < p1.length; i++) {
                const t1 = p1[i];
                const t2 = p2[i];
                if (t1 !== t2) {
                    result = false;
                    break;
                }
            }
            return  result;
        }

        console.log('all', JSON.stringify(all))
        let mutiIndex = 0;
        all = all.map(item => {
            if (edited(item.syllable, item.input)) {
                mutiIndex++;
                return {
                    word: item.word,
                    syllable: item.input
                }
            } else {
                return {
                    word: item.word,
                    syllable: item.syllable
                }
            }
        })
        console.log(chalk.green(`\n ☆☆☆☆☆共有${mutiIndex}个单词被重新分词☆☆☆☆☆☆☆☆☆`))
        const targetFile = resolve(target, `words.json`);
        writeFileSync(targetFile, JSON.stringify(all));
        console.log(chalk.green(`\n ☆☆☆☆☆生成分词结果成功☆☆☆☆☆☆☆☆☆☆☆☆ \n ☆☆☆☆☆路径：${targetFile}`))
})
program.parse(process.argv);


