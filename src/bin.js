#!/usr/bin/env node
const { resolve } = require('path');
const { existsSync } = require('fs');
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
    .command('search')
    .description('导出单词')
    .action(async () => {
        console.log(chalk.blue(`\n> 家目录: ${USER_HOME}\n`));
        const base = resolve(USER_HOME, 'Desktop/flipbooks')
        // const paths = glob.sync('D:/Up366TeacherCache/flipbooks');
        console.log(chalk.blue(`\n> base: ${base}\n`));
        const paths = glob.sync(`${base}/*`);
        if (!paths.length) {
            console.log(chalk.red(`> 没有扫描到课本 \n> 路径: ${base}`))
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

        const target = resolve(USER_HOME, 'Desktop', 'edit-book-words');
        if (existsSync(target)) {
            emptyDirSync(target)
        } else {
            ensureDirSync(target)
        }
        console.log(chalk.blue(`\n> 导出目录: ${target}`))
        exportBook(book, target);
        // const root = resolve(__dirname, '../../temp')
        // const params = {
        //     port: 8181, // Set the server port. Defaults to 8080.
        //     host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
        //     root, // Set root directory that's being served. Defaults to cwd.
        //     open: false, // When false, it won't load your browser by default.
        //     ignore: 'scss,my/templates', // comma-separated string for paths to ignore
        //     file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
        //     wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
        //     mount: [['/components', './node_modules']], // Mount a directory to a route.
        //     logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
        //     middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
        // };
        // liveServer.start(params);
    })
program.parse(process.argv);
