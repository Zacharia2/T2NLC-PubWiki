---
ink-type: map+moc+set
---

>[!NOTE]
> 列出，未被索引文件夹中的文件，链接的文件


```dataviewjs
var index_note_paths = dv.pages('"me and the cosmos/索引"').map((note) => {
  return note.file.path;
});

var noins = dv.pages('"me and the cosmos/存储"').map((note) => {
  return { note: note.file, inlinks: note.file.inlinks };
});

// 创建一个数组来收集未被索引的文件
var unindexed_files = [];

noins.forEach((noin) => {
  let isIndexed = false;
  for (let inlink of noin["inlinks"]) {
    if (index_note_paths.indexOf(inlink.path) !== -1) {
      isIndexed = true;
      break; // 如果找到索引，跳出循环
    }
  }
  // 如果文件没有被索引，添加到结果数组中
  if (!isIndexed) {
    unindexed_files.push(noin["note"]);
  }
});

// 使用dv.table()方法创建表格并显示结果
dv.table(
  ["未被索引的文件"],
  unindexed_files.map((file) => [file.link])
);
```

