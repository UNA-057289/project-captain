# 我是超强负责人（project-captain）

一个帮「不太会统筹」的新手负责人的网页：创建项目 → **AI 生成每日待办草案** → 在草案上修改、勾选、看进度。
零基础 28 天挑战的第 1 周产出，当前是**纯前端本地原型**（数据存在浏览器里），下周接入 CloudBase 云数据库和真·AI 接口。

## 怎么运行（运行说明存档 · Day 7）

前提：装好 [Node.js](https://nodejs.org)（本项目用 v22.22.2 开发）。

```bash
# 1. 进入前端文件夹
cd web

# 2. 安装依赖（第一次运行才需要；国内可用镜像加速：
#    npm install --registry=https://registry.npmmirror.com）
npm install

# 3. 启动开发服务器
npm run dev
```

启动成功后，浏览器打开 **http://localhost:5173** 即可使用。

- 生产构建（可选）：`npm run build`，产物在 `web/dist/`
- 数据说明：当前版本数据存在**浏览器的 localStorage**（键名 `project-captain-data-v2`），换电脑/清浏览器缓存数据不迁移——云端存储是下周的任务（见 TECH_DESIGN.md 第八节迁移路线）

## 你可以做什么（当前版本）

1. 首页「＋ 新建项目」：填项目名、定位、起止日期（必填校验 + 日期先后校验）
2. 进项目详情：点「✨ 让 AI 帮我排每日安排」生成每日待办草案（当前为模拟版逻辑，下周换成豆包/DeepSeek 真接口，交互不变）
3. 每天可以有多条待办：添加、编辑、删除、勾选完成
4. 每天可写一句话「今日说明」
5. 顶部进度条实时同步，全部勾完 = 100%

## 项目文档（按学习天序）

| 文档 | 内容 | 产出日 |
|---|---|---|
| [AGENTS.md](./AGENTS.md) | 项目协作规则（含个人规则） | Day 1 / Day 6 |
| [research.md](./research.md) | 需求研究：三产品比较 + MVP 取舍 | Day 3 |
| [PRD.md](./PRD.md) | 产品需求文档：八节 + 14 条验收标准（v1.0.4） | Day 4 |
| [TECH_DESIGN.md](./TECH_DESIGN.md) | 技术设计：路线、数据模型、API、数据流图 | Day 5 |
| [dataflow.svg](./dataflow.svg) | 数据流图 | Day 5 |

## 技术栈

React 18 + Vite 5 + React Router（前端原型）；数据层集中在 `web/src/store.js`（下周替换为 CloudBase 云函数调用）；规划中的 AI 适配层支持豆包 / DeepSeek 切换（环境变量 `AI_PROVIDER`）。
