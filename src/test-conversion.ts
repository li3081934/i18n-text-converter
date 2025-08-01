// 测试文件 - 用于验证i18n转换功能

const testStrings = [
  "你好",           // 应该匹配 common.greeting
  "再见",           // 应该匹配 common.farewell  
  "提交",           // 应该匹配 buttons.submit
  "网络错误",       // 应该匹配 messages.error.network
  "保存成功",       // 应该匹配 messages.success.saved
  "新的文本",       // 不存在，应该生成新键名
  "Hello World"     // 应该匹配 helloWorld
];

// 使用说明：
// 1. 选中上面的任意一个字符串
// 2. 右键选择 "Convert to i18n"
// 3. 观察转换结果
