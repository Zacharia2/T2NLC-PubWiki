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

function file_filter(suppliedPath, regText, flag, ignore, delTarget) {
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
                        if (flag == "z") {
                            if (!reg.test(textData)) {
                                // 删除不符合条件的MD文件。
                                rmSync(absPath, { force: true });
                                console.log(`模式z-已过滤: ${basename}`);
                            }
                        } else if (flag == "f") {
                            if (reg.test(textData)) {
                                // 删除符合条件的MD文件。
                                rmSync(absPath, { force: true });
                                console.log(`模式f-已过滤: ${basename}`);
                            }
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

function update(vault, regText, flag, ignore, delTarget) {
    // var rootDir = "C:\\Users\\Snowy\\Desktop\\quartz"
    var contentPath = resolve("./content")
    var icontent = readFileSync(resolve("./README.md"), 'utf8');;
    var IndexFile = join(contentPath, "README.md")
    rmdir(contentPath)
    copydir(vault, contentPath)
    file_filter(contentPath, regText, flag, ignore, delTarget)

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
    "C:/Users/111/Desktop/Veiled-Realms/me and the cosmos",
    "ink mut",
    "f",
    [".git", ".obsidian", "绘图", "附件"],
)