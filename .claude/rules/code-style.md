# Code Style Compliance

## 配置文件层级结构

生成代码前，必须先读取相关配置文件以获取最新的代码规范。

### 根目录统一配置（所有子项目共享）

| 配置类型 | 文件路径 | 说明 |
|---------|---------|------|
| Prettier | `.prettierrc` | 格式化规则，全局生效 |
| Prettier 忽略 | `.prettierignore` | 忽略文件列表 |
| ESLint | `.eslintrc.cjs` | Lint 规则，全局生效 |
| TypeScript 基础 | `tsconfig.base.json` | 基础 TS 配置，被子项目继承 |

### 子项目独立配置（继承根目录配置）

| 子项目 | 文件路径 | 说明 |
|--------|---------|------|
| `apps/host` | `tsconfig.json` | 继承 `tsconfig.base.json`，React JSX 配置 |
| `apps/react-child` | `tsconfig.json` | 继承 `tsconfig.base.json`，React JSX 配置 |
| `apps/vue-child` | `tsconfig.json` | 继承 `tsconfig.base.json`，Vue 配置 |

## 配置读取策略

1. **Prettier/ESLint** - 读取根目录配置即可（全局统一）
2. **TypeScript** - 根据当前修改的子项目，读取对应 `tsconfig.json`（先看继承链）
3. **优先级** - 子项目配置覆盖根目录基础配置

## 代码生成流程

1. **读取配置** - 使用 Read 工具读取相关配置文件
2. **应用规则** - 根据配置生成符合规范的代码
3. **验证代码** - 运行 `pnpm lint` 检查 ESLint，`pnpm format` 格式化

## 同步更新要求

当项目配置文件修改时，本文件无需更新。配置始终从源文件动态读取。

**禁止在此文件硬编码具体规则值**（如 `semi: true`、`singleQuote: true` 等），以避免配置不一致。

## 忽略文件

忽略规则由以下配置文件管理，动态读取：

- `.prettierignore` - Prettier 忽略规则
- `.eslintrc.cjs` 中的 `ignorePatterns` - ESLint 忽略规则