###整体(如果与之前要求冲突，以本文档为准)
风格一句话: “现代科技极简主义（Modern Tech Minimalism）” + “内容优先（Content-First）” 
1. 视觉基调（Visual Tone）

色彩：#FFFFFF 纯白底或 #F5F5F7 浅灰底（苹果风）。文字用 #1D1D1F（近乎黑色）与 #86868B（高级灰）。彩色使用#F98C53,#D2E0AA,#ABD7FB,#F9F2EF,#FCCEB4
字体：系统无衬线栈（-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif）。标题字重 font-weight: 600 或 700，正文字重 400，行高 1.5 或 1.6。

2. 布局与间距（Spacing & Layout）——最关键

呼吸感：容器内边距使用 padding: 4rem 至 8rem（桌面端），元素间间距使用 gap: 2rem 以上。

网格：采用 12列栅格，但内容最大宽度限制在 max-width: 1200px 并居中。拒绝全屏通栏拉伸，两侧必有大量留白。

对齐：严格左对齐（LTR语言），标题与正文之间垂直间距至少是字号的两倍。

3. 组件语言（Component Language）

导航栏：透明背景（transparent）或极浅毛玻璃（backdrop-filter: blur(20px); background: rgba(255,255,255,0.7)）。仅保留Logo + 导航链接 + CTA按钮，无下拉阴影，无底部边框。

卡片：background: #ffffff; border-radius: 20px 或 28px（大圆角）; box-shadow: 0 4px 20px rgba(0,0,0,0.04) 至 0 8px 40px rgba(0,0,0,0.06)。阴影必须极度柔和（雾化阴影）。

按钮：填充型（Solid）使用纯色背景+白色文字；线框型（Ghost）使用 border: 1px solid #d2d2d7。悬停时仅微抬（transform: translateY(-2px)）或加深颜色，禁止夸张的缩放或抖动。

4. 动效哲学（Motion Philosophy）

过渡曲线统一使用 cubic-bezier(0.25, 0.1, 0.25, 1) 或 ease-out。

入场动画：页面元素滚动进入时使用 opacity: 0 → 1 结合 translateY(20px) → 0，持续时间 0.6s - 0.8s，带 stagger（逐项延迟 0.05s-0.1s）。

###登录页（参考图已有，只补视觉）
背景是什么样：纯色。色值：#F5F5F7 浅灰底
"进入情绪气象台"按钮的颜色：黑底白字。圆角、大小：9999px（药丸形）	rounded-full，大小你来调整。要给按钮加上 whitespace-nowrap（不换行），移动端若宽度不够，再配合 text-sm 回退。
用户名/密码输入框样式：1. 核心尺寸（与按钮严格对齐）
高度：统一 56px（h-14） ——与按钮等高，保证视觉基线对齐，切换光标时无跳动感。

圆角：16px（rounded-2xl） ——介于直角和全圆之间，既柔和又保持输入框应有的“字段边界感”。

最大宽度：推荐 360px - 400px（max-w-sm），在桌面上居中，避免文字拉伸过远导致阅读疲劳。

2. 色彩与背景（极简呼吸感）
背景：纯白 bg-white 或 极浅毛玻璃 bg-white/70 backdrop-blur-sm（若您的登录页有背景图）。

边框（默认）：border border-[#e5e5ea]（苹果分割线灰），不添加任何阴影，保持扁平干净。

边框（聚焦）：移除默认蓝色环（outline-none），改为 主题色光晕 —— 匹配按钮的渐变紫，使用 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20。

3. 文字排版
标签（Label）：位于输入框上方（不用占位符替代标签，符合无障碍规范）。字号 text-sm（14px），字重 font-medium，颜色 text-[#1d1d1f]，与输入框间距 gap-1.5。

占位符（Placeholder）：字号 text-base（16px，防止iOS自动缩放），颜色 text-[#8e8e93]（苹果占位符灰）。

输入内容：字号 text-base，颜色 text-[#1d1d1f]，字重 font-normal。

###首页（参考图已有，只补视觉）
背景：纯色，静态，#F5F5F7 浅灰底
中央天气大字黑色，静态
近 7 天图标区、底部主按钮的样式：你来设计

###记录页（无参考图，需描述）
三步是"同一页逐步切换"
6 个天气选项长什么样：直接显示“天气”文件夹中的图片
输入框、地点标签、确认按钮样式：你定

###查看页（无参考图，交互已由动画.md 定死）
卡片显示“天气”文件夹中的图片

卡片上日期、短句、地点标签的字体颜色与位置：位于卡片下部。但不要直接显示在图片上，内容下方应有如纯色背景的底子，避免
页面底色：该情绪的渐变色

###个人页（无参考图，需描述）
布局：居中仪式感（首选，最具“情绪”氛围）
适用场景：用户进入首页时的“欢迎回来”过渡页，营造被重视的仪式感。

布局：头像和文字在卡片内垂直居中，形成稳定的“倒金字塔”视觉。

间距：头像与用户名间距 gap-4（16px），用户名与辅助信息（如“今日心情晴”）间距 gap-1.5。

头像：w-28 h-28（112px），rounded-full，外圈加 2px 白边（ring-2 ring-white/80）和微弱阴影，在背景图片上“浮”起来。

排版：

主标题（用户名）：text-2xl font-semibold text-[#1d1d1f] tracking-tight

副标题（情绪状态）：text-sm font-normal text-[#86868B] tracking-wide
头像样式：圆形。用户名显示、修改和上传的按钮样式：与其它页面保持相同风格即可