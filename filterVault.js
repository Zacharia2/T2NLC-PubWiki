import { join, resolve, relative, dirname, basename } from "path"
import {
  rmSync,
  statSync,
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "fs"
import { log } from "console"

var ignore = [".git", ".obsidian"],
  delTarget = [".git", ".obsidian", ".stignore", ".gitignore"],
  regMdFileText = "",
  contentPath = resolve("./content"),
  vaultFullPath,
  mode_filter,
  imgPath

function isUrl(str) {
  var v = new RegExp(
    "^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$",
    "i",
  )
  return v.test(str)
}
function im_syntax(page_content) {
  const im_syntax = { ob_pattern: /\!\[\[(.*?)\]\]/g, md_pattern: /\!\[(.*?)\]\((.*?)\)/g }
  const ext_def = ["jpg", "jpeg", "png", "gif", "bmp", "svg"]
  const im_ob_array = [...page_content.matchAll(im_syntax.ob_pattern)]
  const im_md_array = [...page_content.matchAll(im_syntax.md_pattern)]
  let result = []

  // Embeds ![[]]
  for (const im in im_ob_array) {
    let im_str_full = im_ob_array[im][0] // ![[$1]]
    let im_content = im_ob_array[im][1] // $1
    let im_param_arr = im_content.split("|") // a|b to [a, b]
    let main_name = im_param_arr[0]
    let link_extension = main_name.split(".").slice(-1)[0]
    if (ext_def.indexOf(link_extension) !== -1) {
      if (!isUrl(main_name)) result.push(main_name)
    }
  }

  // ![AltText|100x100](https://url/to/image.png) url、内部链接
  for (const im in im_md_array) {
    let im_str_full = im_md_array[im][0] // ![AltText|100x100](https://url/to/image.png)
    let im_param = im_md_array[im][1] // AltText|100x100
    let im_link = im_md_array[im][2] // https://url/to/image.png
    let im_param_arr = im_param.split("|") // a|b to [a, b]
    let alttext = im_param_arr[0]
    // ![](url or filename)
    // [img [Motovun Jack.jpg]]
    if (im_param_arr.length === 0 || alttext.trim() === "") {
      if (!isUrl(im_link)) result.push(im_link)
    } else if (im_param_arr.length === 1) {
      // ![alttext](url or filename)
      if (!isUrl(im_link)) result.push(im_link)
    } else if (im_param_arr.length >= 2) {
      // ![AltText|100x100](url or filename)
      // [img width=32 [Motovun Jack|Motovun Jack.jpg]]
      if (!isUrl(im_link)) result.push(im_link)
    }
  }
  return result
}

function rmDirContent(folderPath) {
  rmSync(folderPath, { recursive: true, force: true })
  console.log(`已删除: ${folderPath}`)
  if (!existsSync(contentPath)) {
    mkdirSync(contentPath)
  }
}

function copyFile1(sfile, tfile) {
  try {
    mkdirSync(dirname(tfile), { recursive: true })
    copyFileSync(sfile, tfile)
    console.log(`已筛选并复制: ${basename(sfile)}`)
  } catch (err) {
    log(err)
  }
}

function filter_file(suppliedPath, flag) {
  let used_img_list = []
  if (!statSync(suppliedPath).isDirectory()) {
    console.log("Not folder: " + suppliedPath)
    return
  }
  // 必须是一个文件夹库
  let stack = [suppliedPath]
  while (stack.length !== 0) {
    let curr_path = stack.pop() || ""
    for (const item_path of readdirSync(curr_path)) {
      let basename, extension
      let absPath = join(curr_path, item_path)
      if (statSync(absPath).isFile()) {
        // 是文件
        let separate = item_path.lastIndexOf(".")
        basename = item_path.substring(0, separate)
        extension = item_path.substring(separate + 1)
        if (delTarget.includes(item_path)) {
          // 是需要删掉的文件
          continue
        }
        if (extension === "md") {
          let textData = readFileSync(absPath, "utf8")
          let reg = RegExp(regMdFileText)
          if (flag == "z") {
            if (reg.test(textData)) {
              copyFile1(absPath, resolve(contentPath, relative(vaultFullPath, absPath)))
              used_img_list = [...used_img_list, ...im_syntax(textData)]
            }
          } else if (flag == "f") {
            if (!reg.test(textData)) {
              copyFile1(absPath, resolve(contentPath, relative(vaultFullPath, absPath)))
              used_img_list = [...used_img_list, ...im_syntax(textData)]
            }
          }
        }
      } else {
        // 是目录
        if (delTarget.includes(item_path))
          // 是需要删掉的目录
          continue
        if (!ignore.includes(item_path)) {
          // 过滤掉不需要的目录。
          stack.push(absPath)
        }
      }
    }
  }
  for (let index = 0; index < used_img_list.length; index++) {
    const element = used_img_list[index]
    copyFile1(resolve(imgPath, element), resolve(contentPath, "attachment", element))
  }
}

function update() {
  // var rootDir = "C:\\Users\\Snowy\\Desktop\\quartz"
  var icontent = readFileSync(resolve("./README.md"), "utf8")
  var IndexFile = join(contentPath, "index.md")
  rmDirContent(contentPath)

  filter_file(vaultFullPath, mode_filter)

  // 复制Index文件。
  try {
    statSync(IndexFile).isFile()
    console.log(`Index文件已存在。`)
  } catch (err) {
    if (err.code === "ENOENT") {
      writeFileSync(IndexFile, icontent)
      console.log(`文件 ${IndexFile} 创建成功`)
    } else {
      console.error(`创建文件时出错: ${err}`)
    }
  }
  console.log("Done!")
}

// Main
vaultFullPath = "D:/GitHub/Veiled-Realms/me and cosmos"
imgPath = "D:/GitHub/Veiled-Realms/zephyr zone/assets"
ignore = [".git", ".obsidian", "绘图", "附件"]
mode_filter = "f"
regMdFileText = "ink-acc: mut"
update()
