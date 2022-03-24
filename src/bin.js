#!/usr/bin/env node
const { resolve } = require('path');
const os = require('os');
const { existsSync, readFileSync, writeFileSync} = require('fs');
const { program } = require('commander');
const glob = require('glob');
const inquirer = require('inquirer');
const liveServer = require("live-server");
const exportBook = require('./export-book.js');
const chalk = require("chalk");
const {emptyDirSync, ensureDirSync} = require("fs-extra");

// 获取用户家目录
const USER_HOME = process.env.HOME || process.env.USERPROFILE

program
    .command('package')
    .description('查询课本导出选中课本中的单词数据')
    .action(async () => {
        console.log(chalk.cyan(`\n> 家目录: ${USER_HOME}`));
        const base = resolve(USER_HOME, './Desktop/flipbooks')
        // const base = 'D:/Up366TeacherCache/flipbooks';
        console.log(chalk.cyan(`> 查找根路径: ${base}\n`));
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
        console.log(chalk.cyan(`\n> 导出目录: ${target}`))
        exportBook(book, target);
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


