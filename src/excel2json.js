const xlsx = require('node-xlsx');

function excel2json(input) {
  // 解析得到文档中的所有 sheet
  const sheets = xlsx.parse(input);

  const cache = {

  }

  // 遍历 sheet
  sheets.forEach(function(sheet){
      // 读取每行内容
      for(const rowId in sheet['data']){
        let [_word = '', _raw = '', _syllables = ''] = sheet['data'][rowId];
        _raw = _raw.trim()
        _syllables = _syllables.trim()
        const word = String(_word).trim()
        const syllables = _syllables ? _syllables.split(/,|·/) : _raw ? _raw.split(/,|·/) : [word]
        if (_raw !== 'NULL') {
          cache[word] = syllables
        } else {
          cache[word] = [word];
        }
      }
  });

  return cache;
}

module.exports = excel2json

