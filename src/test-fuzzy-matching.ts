// 测试模糊匹配功能

/*
新的模糊匹配功能测试：

1. 精确匹配（优先级最高）：
*/
const exactMatches = [
  "你好",          // 精确匹配: common.greeting
  "保存成功",      // 精确匹配: messages.success.saved
  "网络错误"       // 精确匹配: messages.error.network
];

/*
2. 模糊匹配（包含关系）：
*/
const fuzzyMatches = [
  "你好",          // 会匹配到多个: common.greeting("你好") 和 common.hello("你好世界")
  "保存",          // 会匹配到多个: buttons.save("保存") 和 buttons.saveAll("保存全部") 和 messages.success.saved("保存成功")
  "错误",          // 会匹配到多个: error("Error") 和 messages.error.network("网络错误") 等
  "成功"           // 会匹配到多个: success("Success") 和各种成功消息
];

/*
3. 部分匹配测试：
*/
const partialMatches = [
  "登录",          // 会匹配: auth.login("登录") 和 auth.logout("退出登录")
  "加载",          // 会匹配: messages.info.loading("加载中...")
  "处理"           // 会匹配: messages.info.processing("处理中...")
];

/*
4. 无匹配（会创建新键）：
*/
const noMatches = [
  "这是全新的文本",
  "完全不存在的内容",
  "新的翻译条目"
];

/*
测试流程：

1. 精确匹配测试：
   - 选中 "你好" → 如果JSON中只有一个精确匹配，直接使用
   - 选中 "保存成功" → 直接匹配到 messages.success.saved

2. 多个匹配测试：
   - 选中 "保存" → 会弹出选择框，显示：
     * buttons.save: "保存"
     * buttons.saveAll: "保存全部" 
     * messages.success.saved: "保存成功"
   - 用户可以选择最合适的一个

3. 模糊匹配测试：
   - 选中 "错误" → 可能匹配到包含"错误"的所有条目
   - 弹出选择框让用户选择

使用说明：
1. 配置 i18nConverter.jsonFilePath 为 "i18n.json"
2. 选中上面的任意测试文字
3. 右键选择 "Convert to i18n"
4. 观察不同的匹配行为：
   - 单个匹配：直接转换
   - 多个匹配：弹出选择框
   - 无匹配：弹出输入框
*/
