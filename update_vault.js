import { join, resolve } from "path";
import { rmSync, cpSync, statSync, readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";

function rmdir(folderPath) {
    rmSync(folderPath, { recursive: true, force: true });
    console.log(`已删除: ${folderPath}`);
}

function copydir(sourceFolder, destinationFolder) {
    if (!existsSync(destinationFolder)) {
        mkdirSync(destinationFolder);
    }
    // 复制目录及其内容
    cpSync(sourceFolder, destinationFolder, {
        recursive: true,
    });
    console.log(`已成功复制文件夹: ${sourceFolder}`);
}

function file_filter(suppliedPath, regText, ignore, delTarget) {
    var ignore = ignore || [".git", ".obsidian"],
        delTarget = delTarget || [".git", ".obsidian", ".stignore", ".gitignore"],
        basename,
        extension,
        regMdFileText = regText || '';
    if (statSync(suppliedPath).isDirectory()) {
        // 必须是一个文件夹库
        let stack = [suppliedPath]
        while (stack.length !== 0) {
            let curr_path = stack.pop()
            for (const item_path of readdirSync(curr_path)) {
                let absPath = join(curr_path, item_path)
                if (statSync(absPath).isFile()) {
                    // 是文件
                    let separate = item_path.lastIndexOf('.')
                    basename = item_path.substring(0, separate);
                    extension = item_path.substring(separate + 1);
                    if (delTarget.includes(item_path)) {
                        // 是需要删掉的文件
                        rmdir(absPath)
                    }
                    if (extension === 'md') {
                        let textData = readFileSync(absPath, 'utf8');
                        let reg = RegExp(regMdFileText);
                        if (!reg.test(textData)) {
                            // 删掉不符合的MD文件。
                            rmSync(absPath, { force: true })
                            console.log(`已过滤: ${basename}`);
                        }
                    }
                } else {
                    // 是目录
                    if (delTarget.includes(item_path))
                        // 是需要删掉的目录
                        rmdir(absPath)
                    if (!ignore.includes(item_path)) {
                        // 过滤掉不需要的目录。
                        stack.push(absPath);
                    }
                }
            }
        }
    } else {
        console.log("Not folder: " + suppliedPath);
    }
}

function update(vault, regText, ignore, delTarget) {
    // var rootDir = "C:\\Users\\Snowy\\Desktop\\quartz"
    var contentPath = resolve("./content")
    var icontent = readFileSync(resolve("./index.md"), 'utf8');;
    var IndexFile = join(contentPath, "index.md")
    rmdir(contentPath)
    copydir(vault, contentPath)
    file_filter(contentPath, regText, ignore, delTarget)

    // 同步写入文件
    try {
        statSync(IndexFile).isFile()
        console.log(`Index文件已存在。`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            writeFileSync(IndexFile, icontent);
            console.log(`文件 ${IndexFile} 创建成功`);
        } else {
            console.error(`创建文件时出错: ${err}`);
        }
    }
    console.log("Done!");
}

update(
    "C:\\Users\\Snowy\\Documents\\GitHub\\Thought-Thing-NL-Cognition",
    "ink pub",
    [".git", ".obsidian", "绘图", "附件"]
)