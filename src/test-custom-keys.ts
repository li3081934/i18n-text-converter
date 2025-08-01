// 测试自定义键名和JSON文件更新功能

/*
新功能测试流程：
1. 选中一个不存在于i18n.json中的文字
2. 右键选择 "Convert to i18n"
3. 会弹出输入框，让你输入自定义的key
4. 插件会自动更新i18n.json文件
5. 将选中的文字替换为格式化的i18n调用

示例：
*/

const newTexts = [
  "这是新的文本",        // 不存在的文字，会弹出输入框
  "用户自定义内容",      // 不存在的文字，会弹出输入框
  "测试嵌套键名",        // 不存在的文字，可以输入如 test.nested.key
  "登录成功",           // 不存在的文字，可以输入如 auth.loginSuccess
];

/*
测试用例：

1. 选中 "这是新的文本"
   - 建议键名: zhiShiXinDeWenBen
   - 可以修改为: common.newText
   - 结果: common.newText 会被添加到 i18n.json

2. 选中 "登录成功" 
   - 建议键名: dengLuChengGong
   - 可以修改为: auth.success.login
   - 结果: 会在 i18n.json 中创建嵌套结构

已存在的文字（用于对比）：
*/

const existingTexts = [
  "你好",           // 存在: common.greeting
  "网络错误",       // 存在: messages.error.network
];

/*
使用说明：
1. 确保配置了 i18nConverter.jsonFilePath
2. 选中上面的任意新文字
3. 右键选择 "Convert to i18n"
4. 在弹出的输入框中输入你想要的键名
5. 观察 i18n.json 文件的变化
*/
