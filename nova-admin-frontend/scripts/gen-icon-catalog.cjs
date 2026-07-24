#!/usr/bin/env node
/**
 * 生成 src/components/IconPicker/icon-catalog.ts
 * 运行方式：node scripts/gen-icon-catalog.cjs
 */
'use strict';

const path = require('path');
const fs = require('fs');

// ─── 词典：英文单词 → 中文 ────────────────────────────────────────────────
const DICT = {
  Account: ['账户', '账号'],
  Add: ['添加', '新增', '增加'],
  Aim: ['瞄准', '目标'],
  Alert: ['警报', '提醒', '告警'],
  Ali: ['阿里'],
  Align: ['对齐'],
  Android: ['安卓', 'Android'],
  Ant: ['蚂蚁'],
  Api: ['接口', 'API'],
  Apple: ['苹果', 'Apple'],
  Area: ['区域', '面积'],
  Apartment: ['组织', '部门', '层级'],
  Appstore: ['应用商店', '应用', '应用市场'],
  Arrow: ['箭头'],
  Audio: ['音频', '声音'],
  Audit: ['审计', '审核'],
  Award: ['奖励', '奖项'],
  Back: ['返回', '后退'],
  Backward: ['后退', '后退'],
  Bank: ['银行', '金融'],
  Bar: ['柱状', '条形'],
  Barcode: ['条形码'],
  Battery: ['电池'],
  Bell: ['铃铛', '通知', '提醒'],
  Block: ['块', '区块'],
  Bold: ['加粗', '粗体'],
  Book: ['书', '文档', '手册'],
  Border: ['边框'],
  Bot: ['机器人', 'AI'],
  Box: ['盒子', '箱子'],
  BoxPlot: ['箱线图'],
  Branch: ['分支', '枝'],
  Branches: ['分支', '多分支'],
  Browser: ['浏览器'],
  Bug: ['缺陷', '错误', '问题'],
  Build: ['构建', '建造'],
  Bulb: ['灯泡', '想法', '创意'],
  Calculator: ['计算器', '计算'],
  Calendar: ['日历', '日期', '时间'],
  Camera: ['相机', '拍照', '摄像'],
  Car: ['汽车', '车辆'],
  Card: ['卡片'],
  Carry: ['搬运', '携带'],
  Chart: ['图表', '统计'],
  Check: ['勾选', '确认', '选中'],
  CheckSquare: ['勾选框', '复选框'],
  Chrome: ['Chrome浏览器'],
  Clear: ['清除', '清空'],
  Clock: ['时钟', '时间'],
  Close: ['关闭', '关', '删除'],
  Cloud: ['云', '云端', '云服务'],
  CloudDownload: ['云下载'],
  CloudServer: ['云服务器'],
  CloudSync: ['云同步'],
  CloudUpload: ['云上传'],
  Cluster: ['集群', '集合'],
  Code: ['代码', '编程', '开发'],
  Codepen: ['Codepen'],
  Coffee: ['咖啡'],
  Collapse: ['折叠', '收起'],
  Column: ['列', '栏'],
  Comment: ['评论', '注释'],
  Compass: ['指南针', '导航', '方向'],
  Compress: ['压缩', '收缩'],
  Console: ['控制台', '终端'],
  Container: ['容器', '包含'],
  Control: ['控制', '管理'],
  Copy: ['复制', '拷贝'],
  Copyright: ['版权'],
  Credit: ['信用', '积分'],
  Crop: ['裁剪'],
  Crown: ['皇冠', 'VIP', '顶级'],
  Customer: ['客户', '用户'],
  Cut: ['剪切', '裁剪'],
  Dashboard: ['仪表盘', '看板', '概览'],
  Data: ['数据'],
  Database: ['数据库'],
  Delete: ['删除', '移除', '清除'],
  Deploy: ['部署', '发布'],
  Desktop: ['桌面', '电脑'],
  Dingding: ['钉钉'],
  Disconnect: ['断开', '断链'],
  Dislike: ['踩', '不喜欢'],
  Dollar: ['美元', '钱', '金额'],
  Dot: ['圆点', '点'],
  Down: ['下', '向下'],
  Download: ['下载'],
  Drag: ['拖拽', '移动'],
  Dribbble: ['Dribbble'],
  Dropbox: ['Dropbox'],
  Edit: ['编辑', '修改'],
  Ellipsis: ['省略', '更多'],
  Email: ['邮件', '邮箱'],
  Enter: ['进入', '回车'],
  Environment: ['环境', '地点', '位置', '地址'],
  Eraser: ['橡皮擦', '清除'],
  Error: ['错误', '异常'],
  Euro: ['欧元'],
  Except: ['除外'],
  Exclamation: ['感叹号', '警告', '注意'],
  Expand: ['展开', '扩展', '扩大'],
  Experiment: ['实验', '测试'],
  Export: ['导出', '输出'],
  Eye: ['眼睛', '查看', '预览', '可见'],
  EyeInvisible: ['隐藏', '不可见'],
  Facebook: ['Facebook'],
  Fall: ['下降', '下跌'],
  FastBackward: ['快退'],
  FastForward: ['快进'],
  Field: ['字段'],
  File: ['文件', '文档'],
  FileAdd: ['新增文件'],
  FileDone: ['文件完成'],
  FileExcel: ['Excel文件'],
  FileExclamation: ['文件警告'],
  FileGif: ['GIF文件'],
  FileImage: ['图片文件'],
  FileJpg: ['JPG文件'],
  FileMarkdown: ['Markdown文件'],
  FilePdf: ['PDF文件'],
  FilePpt: ['PPT文件'],
  FileProtect: ['文件保护'],
  FileSearch: ['文件搜索'],
  FileSync: ['文件同步'],
  FileText: ['文本文件', '文档'],
  FileUnknown: ['未知文件'],
  FileWord: ['Word文件'],
  FileZip: ['压缩文件'],
  Filter: ['筛选', '过滤'],
  Fire: ['火', '热门', '热'],
  Flag: ['旗帜', '标记', '标签'],
  Folder: ['文件夹', '目录'],
  FolderAdd: ['新建文件夹'],
  FolderOpen: ['打开文件夹'],
  FolderView: ['查看文件夹'],
  FontColors: ['字体颜色'],
  FontSize: ['字体大小', '字号'],
  Fork: ['分叉'],
  Form: ['表单', '表格'],
  Format: ['格式'],
  Forward: ['前进'],
  FrownOpen: ['皱眉', '不满'],
  Frown: ['皱眉', '不满', '难过'],
  FullScreen: ['全屏'],
  Fullscreen: ['全屏'],
  Fund: ['基金', '资金', '财务'],
  Gateway: ['网关'],
  Gift: ['礼物', '礼品'],
  Github: ['GitHub'],
  Gitlab: ['GitLab'],
  Global: ['全球', '国际', '语言', '地球'],
  Gold: ['金', '黄金'],
  Google: ['Google'],
  Group: ['分组', '群组'],
  Hdd: ['硬盘', '存储'],
  Heart: ['心', '喜欢', '收藏'],
  Heat: ['热力', '热图'],
  Highlight: ['高亮', '强调'],
  History: ['历史', '记录'],
  Home: ['首页', '主页', '家'],
  Html: ['HTML'],
  Html5: ['HTML5'],
  Http: ['HTTP', '协议'],
  Ie: ['IE浏览器'],
  Image: ['图片', '图像'],
  Import: ['导入', '引入'],
  Inbox: ['收件箱', '邮件'],
  Indent: ['缩进'],
  Info: ['信息', '详情'],
  Insert: ['插入'],
  Instagram: ['Instagram'],
  Interaction: ['交互', '互动'],
  Italic: ['斜体'],
  Key: ['钥匙', '权限', '密钥'],
  Laptop: ['笔记本', '电脑'],
  Layout: ['布局', '版式'],
  Left: ['左', '向左'],
  Like: ['点赞', '喜欢'],
  Line: ['线条', '折线'],
  Link: ['链接', '关联'],
  Linkedin: ['LinkedIn'],
  Linux: ['Linux'],
  Loading: ['加载', '加载中'],
  Lock: ['锁', '加锁', '安全'],
  Login: ['登录'],
  Logout: ['登出', '退出'],
  MacCommand: ['Mac命令键'],
  Mail: ['邮件', '邮箱'],
  Man: ['男', '男性'],
  ManyToOne: ['多对一'],
  Medium: ['Medium'],
  Menu: ['菜单', '导航'],
  Merge: ['合并'],
  Message: ['消息', '通知'],
  Minus: ['减少', '减号', '折叠'],
  Mobile: ['手机', '移动'],
  Money: ['金钱', '钱'],
  Monitor: ['监控', '监视器', '显示器'],
  More: ['更多'],
  Mountain: ['山', '景观'],
  Muted: ['静音'],
  Node: ['节点'],
  NotificationOutlined: ['通知', '提醒', '公告'],
  Notification: ['通知', '提醒', '公告'],
  Number: ['数字', '编号'],
  Object: ['对象'],
  Obsolete: ['废弃'],
  OneToMany: ['一对多'],
  OneToOne: ['一对一'],
  Open: ['打开'],
  Ordered: ['有序'],
  Outdent: ['取消缩进'],
  Paper: ['纸', '文档'],
  Paperclip: ['附件', '回形针'],
  Partition: ['分区', '分割'],
  Pause: ['暂停'],
  Pay: ['支付', '付款'],
  PayCircle: ['支付', '圆形支付'],
  Percent: ['百分比', '折扣'],
  Phone: ['电话', '手机'],
  Picture: ['图片', '图像'],
  Pie: ['饼图', '圆形'],
  Play: ['播放'],
  PlaySquare: ['播放', '方形播放'],
  Plus: ['添加', '加号', '新增', '增加'],
  Pound: ['英镑'],
  PowerOff: ['关机', '电源'],
  Print: ['打印'],
  Profile: ['概要', '档案', '配置文件'],
  Project: ['项目'],
  Property: ['属性'],
  Pull: ['拉取', '拖'],
  Push: ['推送', '推'],
  Pushpin: ['图钉', '置顶'],
  QrCode: ['二维码', 'QR码'],
  QuestionCircle: ['帮助', '问题'],
  Question: ['问题', '帮助'],
  Queue: ['队列'],
  Radius: ['圆角'],
  Read: ['阅读', '读取'],
  Reconciliation: ['核对', '对账'],
  Red: ['红', '红色'],
  Redo: ['重做', '恢复'],
  Reload: ['刷新', '重新加载'],
  Rest: ['REST'],
  Retail: ['零售'],
  Right: ['右', '向右'],
  Rise: ['上升', '增长'],
  Robot: ['机器人', 'AI', '自动化'],
  Rocket: ['火箭', '发射', '启动'],
  Rollback: ['回滚', '撤销'],
  Row: ['行'],
  Safari: ['Safari浏览器'],
  Safety: ['安全', '防护'],
  SafetyCertificate: ['安全认证', '证书'],
  Save: ['保存', '存储'],
  Scan: ['扫描'],
  Schedule: ['计划', '日程', '排班', '定时'],
  Scissor: ['剪刀', '裁剪'],
  Scisors: ['剪刀', '裁剪'],
  Search: ['搜索', '查找', '查询'],
  Select: ['选择', '选取'],
  Send: ['发送'],
  Setting: ['设置', '配置', '选项'],
  Share: ['分享', '共享'],
  Shop: ['商店', '商城'],
  Shopping: ['购物', '购买'],
  Shrink: ['收缩', '缩小'],
  Sketch: ['设计', '草图'],
  Skin: ['皮肤', '主题'],
  Slack: ['Slack'],
  Sliders: ['滑块', '调节'],
  Small: ['小'],
  SmileOpen: ['笑脸', '满意'],
  Smile: ['笑脸', '满意', '高兴'],
  Solution: ['解决方案', '方案'],
  Sort: ['排序'],
  Sound: ['声音', '音频', '音量'],
  Split: ['分割', '拆分'],
  Star: ['星', '收藏', '评分'],
  Status: ['状态'],
  Step: ['步骤'],
  Stock: ['股票', '库存'],
  Stop: ['停止', '禁止'],
  StrikeThrough: ['删除线'],
  Sub: ['子级'],
  Subnode: ['子节点'],
  SwapLeft: ['向左交换'],
  SwapRight: ['向右交换'],
  Swap: ['交换', '互换'],
  Switch: ['开关', '切换'],
  Sync: ['同步', '刷新'],
  Table: ['表格', '数据表'],
  Tag: ['标签', '标记'],
  Taobao: ['淘宝'],
  Tablet: ['平板', '平板电脑'],
  Team: ['团队', '群组', '成员'],
  Text: ['文本', '文字'],
  Theme: ['主题'],
  To: ['到'],
  Tool: ['工具'],
  Trademark: ['商标'],
  Transaction: ['交易', '事务'],
  Translation: ['翻译', '语言'],
  Trophy: ['奖杯', '成就'],
  Twitter: ['Twitter'],
  Underline: ['下划线'],
  Undo: ['撤销'],
  Ungroup: ['取消分组'],
  Unlock: ['解锁', '开锁'],
  Unordered: ['无序'],
  Up: ['上', '向上'],
  Upload: ['上传'],
  Usb: ['USB'],
  User: ['用户', '人员', '账号', '个人'],
  UserAdd: ['添加用户', '新用户'],
  UserDelete: ['删除用户'],
  UserGroup: ['用户组', '群组'],
  UserSwitch: ['切换用户'],
  Verified: ['已验证', '认证'],
  Video: ['视频', '视频播放'],
  VideoCameraAdd: ['添加摄像头'],
  VideoCamera: ['摄像头', '摄像机', '视频'],
  Wallet: ['钱包'],
  Warning: ['警告', '注意', '告警'],
  Weibo: ['微博'],
  Wechat: ['微信'],
  Wifi: ['WiFi', '无线网络', '网络'],
  Windows: ['Windows', '窗口'],
  Woman: ['女', '女性'],
  Yuque: ['语雀'],
  Zhihu: ['知乎'],
  Zoom: ['缩放', '放大缩小'],
  ZoomIn: ['放大'],
  ZoomOut: ['缩小'],
  Apartment: ['层级', '组织架构', '公寓'],
  AlignCenter: ['居中对齐'],
  AlignLeft: ['左对齐'],
  AlignRight: ['右对齐'],
  VerticalAlignBottom: ['底部对齐'],
  VerticalAlignMiddle: ['垂直居中'],
  VerticalAlignTop: ['顶部对齐'],
  DoubleLeft: ['双左'],
  DoubleRight: ['双右'],
  Home: ['首页', '主页', '家'],
  Inbox: ['收件箱'],
  Alert: ['警报', '提示'],
  Canteen: ['食堂', '餐厅'],
  Civil: ['民用'],
  DeliveryBox: ['配送箱', '快递'],
  Dot: ['点', '标记'],
  Field: ['字段', '田野'],
  Hdd: ['硬盘'],
  Insurance: ['保险'],
  Lift: ['电梯', '提升'],
  Man: ['男性', '男士'],
  Mediicine: ['医疗', '药品'],
  Medicine: ['医疗', '医药', '药'],
  Moon: ['月亮', '夜间'],
  Oil: ['石油', '燃油'],
  Paragraph: ['段落'],
  Pic: ['图片'],
  Sig: ['签名'],
  Site: ['网站', '站点'],
  Slope: ['坡度', '斜率'],
  Sun: ['太阳', '晴天'],
  Thunderbolt: ['闪电', '快速', '高速'],
};

// ─── 驼峰分词 ─────────────────────────────────────────────────────────────────
function splitCamel(name) {
  // 去掉结尾的 Outlined / Filled / TwoTone
  const base = name.replace(/(Outlined|Filled|TwoTone)$/, '');
  // 驼峰分词
  const words = base.match(/[A-Z][a-z0-9]*/g) || [base];
  return words;
}

// ─── 为单个 icon name 生成中文别名 ──────────────────────────────────────────
function getAliases(name) {
  const base = name.replace(/(Outlined|Filled|TwoTone)$/, '');
  const set = new Set();

  // 先尝试整体匹配
  if (DICT[base]) {
    DICT[base].forEach((a) => set.add(a));
  }

  // 按分词逐词匹配
  const words = splitCamel(name);
  for (const w of words) {
    if (DICT[w]) DICT[w].forEach((a) => set.add(a));
  }

  return [...set];
}

// ─── 主逻辑 ───────────────────────────────────────────────────────────────────
const antdIcons = require('@ant-design/icons');

const iconNames = Object.keys(antdIcons)
  .filter((k) => {
    const v = antdIcons[k];
    return (
      (typeof v === 'function' || typeof v === 'object') &&
      (k.endsWith('Outlined') || k.endsWith('Filled') || k.endsWith('TwoTone'))
    );
  })
  .sort();

const lines = [];
lines.push(`import * as AntdIcons from '@ant-design/icons';`);
lines.push(`import type React from 'react';`);
lines.push(``);
lines.push(`export interface IconCatalogItem {`);
lines.push(`  name: string;`);
lines.push(`  /** 中文别名，用于中文搜索 */`);
lines.push(`  aliases: string[];`);
lines.push(`  icon: React.ComponentType;`);
lines.push(`}`);
lines.push(``);
lines.push(`export const iconCatalog: readonly IconCatalogItem[] = [`);

for (const name of iconNames) {
  const aliases = getAliases(name);
  const aliasJson = aliases.length
    ? `[${aliases.map((a) => `'${a}'`).join(', ')}]`
    : '[]';
  lines.push(`  { name: '${name}', aliases: ${aliasJson}, icon: AntdIcons.${name} },`);
}

lines.push(`];`);
lines.push(``);
lines.push(`/** 按组件名快速查找 */`);
lines.push(`export const iconCatalogMap: ReadonlyMap<string, IconCatalogItem> = new Map(`);
lines.push(`  iconCatalog.map((item) => [item.name, item]),`);
lines.push(`);`);
lines.push(``);
lines.push(`/**`);
lines.push(` * 将图标名解析为可渲染的 React 元素。`);
lines.push(` * 未知名称或空值回退到 AppstoreOutlined，但不修改原始字符串。`);
lines.push(` */`);
lines.push(`export function getIcon(iconName?: string): React.ReactElement | undefined {`);
lines.push(`  if (!iconName) return undefined;`);
lines.push(`  const item = iconCatalogMap.get(iconName);`);
lines.push(`  const IconComp = item ? item.icon : AntdIcons.AppstoreOutlined;`);
lines.push(`  return <IconComp />;`);
lines.push(`}`);
lines.push(``);
lines.push(`/** 风格后缀 */`);
lines.push(`const STYLE_SUFFIXES = ['Outlined', 'Filled', 'TwoTone'] as const;`);
lines.push(``);
lines.push(`/**`);
lines.push(` * 按关键词过滤图标目录。`);
lines.push(` * 匹配规则（任一命中即返回）：`);
lines.push(` *   1. 完整组件名（大小写不敏感）`);
lines.push(` *   2. 去除风格后缀后的名称（大小写不敏感）`);
lines.push(` *   3. 中文别名包含匹配`);
lines.push(` */`);
lines.push(`export function filterIconCatalog(`);
lines.push(`  catalog: readonly IconCatalogItem[],`);
lines.push(`  keyword: string,`);
lines.push(`): IconCatalogItem[] {`);
lines.push(`  const kw = keyword.trim();`);
lines.push(`  if (!kw) return [...catalog];`);
lines.push(`  const lower = kw.toLowerCase();`);
lines.push(`  return catalog.filter((item) => {`);
lines.push(`    if (item.name.toLowerCase().includes(lower)) return true;`);
lines.push(`    const baseName = STYLE_SUFFIXES.reduce((n, s) => n.replace(new RegExp(s + '$'), ''), item.name);`);
lines.push(`    if (baseName.toLowerCase().includes(lower)) return true;`);
lines.push(`    return item.aliases.some((a) => a.includes(kw));`);
lines.push(`  });`);
lines.push(`}`);

const outPath = path.resolve(
  __dirname,
  '../src/components/IconPicker/icon-catalog.ts',
);
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`✓ 写入 ${outPath}（共 ${iconNames.length} 个图标）`);
