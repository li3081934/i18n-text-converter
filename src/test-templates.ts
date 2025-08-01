// 测试不同的输出模板配置

/*
配置示例 1 - 默认 t() 函数:
{
  "i18nConverter.outputTemplate": "t('@i18nKey')"
}
选中 "你好" → 输出: t('common.greeting')

配置示例 2 - Vue.js $t() 函数:
{
  "i18nConverter.outputTemplate": "$t('@i18nKey')"  
}
选中 "你好" → 输出: $t('common.greeting')

配置示例 3 - React i18next:
{
  "i18nConverter.outputTemplate": "t('@i18nKey')"
}
选中 "你好" → 输出: t('common.greeting')

配置示例 4 - 自定义函数:
{
  "i18nConverter.outputTemplate": "translate('@i18nKey')"
}
选中 "你好" → 输出: translate('common.greeting')

配置示例 5 - 带命名空间:
{
  "i18nConverter.outputTemplate": "i18n.t('@i18nKey')"
}
选中 "你好" → 输出: i18n.t('common.greeting')
*/

const testStrings = [
  "你好",           // 现有键: common.greeting
  "网络错误",       // 现有键: messages.error.network  
  "新的测试文本",   // 新键: 会生成 xinDeCeShiWenBen
];

// 测试步骤:
// 1. 配置你想要的输出模板
// 2. 选中上面的任意字符串
// 3. 右键选择 "Convert to i18n"
// 4. 查看转换结果
