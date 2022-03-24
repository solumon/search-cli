const request = require('request')
const cheerio = require('cheerio')
const URL = 'https://syllablewords.net/syllables-in/'


function requestPromise(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}

function getSyllables(word) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(['嘿嘿', '呵呵', '哈哈'])
        }, 1000)
    })
    // return requestPromise(`${URL}${word}`).then((res) => {
    //     const $ = cheerio.load(res.body)
    //     const $h3 = $('.word-info>h3')
    //     const index = $h3.length - 1
    //     const text = $h3.eq(index).text()
    //     const rawSyllables = text.split('-')
    //     return Promise.resolve(rawSyllables)
    // }).catch((e) => {
    //     return Promise.resolve('---')
    // })
}

module.exports = getSyllables

// 根据拆分单词
// module.exports = function(word) {
//     if(word.includes('〔')){
//         word = word.slice(0,word.indexOf('〔'))
//     }else if(word.includes('(')){
//         word = word.slice(0,word.indexOf('('))
//     }
//     var letters=word.trim();
//     var syllablesArray=[];
//     //如果是短语的话，就按空格分
//     if(letters.indexOf(' ') !== -1){
//         return letters.split(' ')
//     }else{
//         //根据音节拆分
//         while(letters.length>0){
//             var lastSyllable=letters.match(/(^y|y(?=[aeiou])|bh|ch|gh|sc|wr|ng$|[^aeiouy])?([aeiou]*y?)?([^aeiouy]*)?$/i);
//             if(lastSyllable){
//                 var currentSyllable=lastSyllable[0];
//                 syllablesArray.push(currentSyllable);
//                 var syllableLength=currentSyllable.length;
//                 var lettersCount=letters.length;
//                 letters=letters.substr(0,lettersCount-syllableLength);
//             }
//         }
//         if(syllablesArray){
//             var newArray=[]
//             if(syllablesArray.length === 1 && word.length !== 1){
//                 newArray.push(word.slice(0,Math.floor(word.length / 2)))
//                 newArray.push(word.slice(Math.floor(word.length / 2)))
//                 // console.log("===这个单词不能按音节分",newArray)
//                 return newArray
//             }else if(syllablesArray.length>4){
//                 // console.log("音节个数大于四个",word,syllablesArray)
//                 var num = Math.random()>0.5?3:2
//                 for(let i=0;i<num;i++){
//                     newArray.push(word.slice(Math.floor(word.length / num)*i,Math.floor(word.length / num)*(i+1)))
//                     if(i === num-1&&Math.floor(word.length / num)*(i+1)<word.length){
//                         // console.log("有剩余",Math.floor(word.length / num)*(i+1),word.slice(Math.floor(word.length / num)*(i+1)))
//                         newArray.push(word.slice(Math.floor(word.length / num)*(i+1)))
//                     }
//                 }
//                 // console.log("音节大于四",newArray)
//                 return newArray
//             }else{
//                 return syllablesArray.reverse();
//             }

//         }else{
//             return [];
//         }
//     }
// }
