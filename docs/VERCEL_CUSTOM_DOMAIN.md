# Vercel 自定义域名绑定指南 (解决国内访问问题)

由于 Vercel 默认的 `*.vercel.app` 域名在中国大陆被 DNS 污染（无法访问），您必须绑定一个**自定义域名**才能在国内正常使用本应用。

以下是详细的操作步骤：

## 第一步：拥有一个域名
如果您还没有域名，您需要先购买一个。
*   **推荐注册商**: NameSilo, GoDaddy, 阿里云, 腾讯云等。
*   **成本**: 许多后缀（如 `.top`, `.xyz`）第一年非常便宜（几块钱人民币）。
*   **注意**: 如果只要在这个 App 使用，不需要备案（因为服务器在 Vercel 海外），但如果您使用国内服务器则需要备案。建议使用海外注册商（如 NameSilo）可以免去备案烦恼。

## 第二步：在 Vercel 添加域名
1.  登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2.  点击您的项目 **WhatEat**。
3.  点击顶部的 **Settings** (设置) -> 左侧菜单 **Domains** (域名)。
4.  在输入框中输入您想使用的子域名，例如：
    *   `whateat.codewithdorman.com` (假设您拥有 `codewithdorman.com`)
    *   或者直接用主域名 `codewithdorman.com`
5.  点击 **Add**。

## 第三步：配置 DNS 解析 (关键)
添加后，Vercel 会提示 "Invalid Configuration" (无效配置)，并给出需要的 DNS 记录。您需要去您购买域名的地方进行配置。

### 情况 A: 绑定子域名 (推荐)
例如绑定 `app.yourdomain.com`:

1.  登录您的域名管理后台 (阿里云/NameSilo等)。
2.  找到 **DNS 解析** 或 **域名解析** 设置。
3.  添加一条 **CNAME** 记录：
    *   **类型 (Type)**: `CNAME`
    *   **主机记录 (Name/Host)**: `app` (或者是您想要的前缀，如 `whateat`)
    *   **记录值 (Value/Points to)**: `cname.vercel-dns.com`
    *   **TTL**: 默认即可 (如 10分 或 1小时)

### 情况 B: 绑定主域名 (顶级域名)
例如绑定 `yourdomain.com`:

1.  添加一条 **A** 记录：
    *   **类型**: `A`
    *   **主机记录**: `@`
    *   **记录值**: `76.76.21.21` (这是 Vercel 的固定 IP)

## 第四步：等待生效
1.  回到 Vercel 的 Domains 页面。
2.  它会自动刷新状态。通常几分钟内就会变成 **Valid Configuration** (两个勾)。
3.  一旦变绿，您就可以在浏览器中输入您的自定义域名 `app.yourdomain.com` 访问应用了！
4.  这个域名在中国大陆是可以直连访问的，且速度通常不错。

## 常见问题
*   **Q: 需要备案吗？**
    *   A: 只要这步操作是在 Vercel (海外) 上绑定的，且不使用国内 CDN，通常**不需要 ICP 备案**。但请注意遵守当地法律法规。
*   **Q: 为什么它是红色的 Invalid？**
    *   A: DNS 全球生效需要时间（1分钟-24小时不等）。请耐心等待，或者检查 CNAME 记录是否填写正确 (不要多复制空格)。
