
function randomSyllable(word) {
    if (word.length <= 4) {
        return word.split('').join(',')
    } else {
        let index = Math.ceil(Math.random() * word.length) - 1;
        if (index < 1) {
            index = 1;
        }  else if (index > word.length - 1) {
            index = word.length - 2;
        }
        return  `${word.substr(0, index)},${word.substr(index, word.length -1)}`
    }
}

function updateSyllableRow(data, row) {
    if (data.length === 3 && data[2] === '已校验') {
        return data;
    }
    if (data.length === 2) {//如果只有两列说明原有分词正确不需要操作
        return [...data, '已校验'];
    }
    if (data.length < 2) { // 数据错误
        throw new Error(`第${row + 1}列数据格式有误,请检查后保存重新导入`)
    }
    if (data[2] && data[2].trim().length) {
        temp[1] = data[2];
        return [data[0], data[2], '已校验'];
    }
    const temp = [data[0], data[1]];
    if (data.length >= 4) { // 存在随机列
        if (data[3].trim() === '随机') { // 根据随机规则进行分词
            temp[1] = randomSyllable(data[0])
        }
    }
    return [...temp, '已校验'];
}

module.exports = {
    updateSyllableRow,
}
