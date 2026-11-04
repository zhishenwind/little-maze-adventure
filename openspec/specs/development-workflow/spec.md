# development-workflow Specification

## Purpose

让本项目每轮需求与实现都可追溯，通过本地 Git 提交保存精确修改，并以 OpenSpec 保存现行行为、变更动机、设计决策、任务和验证依据，方便后续持续迭代与维护。

## Requirements

### Requirement: 可复现的项目工具

项目 SHALL 使用锁定版本的开发依赖提供 OpenSpec，并通过 npm 命令调用；从受版本管理的依赖清单安装后，无需全局 OpenSpec 即可查询、创建、验证和归档变更。

#### Scenario: 在另一台机器安装项目

- **WHEN** 开发者获取项目并执行 npm ci
- **THEN** npm run spec -- --version 输出项目锁定的 OpenSpec 版本，且可以查询现行规格

### Requirement: 需求与实现过程归档

项目 SHALL 为功能、行为修复和架构变更保存提案、需求 delta、必要设计、任务及实际验证记录；完成后将 delta 同步为主规格，并将过程文件保留在带日期的归档中。

#### Scenario: 完成一轮行为迭代

- **WHEN** 已授权迭代的实现和验收完成且所有任务已核实完成
- **THEN** 主规格反映已交付行为，归档保留本轮原因、决策和验证依据，变更摘要链接到该归档

### Requirement: 统一验证入口

项目 SHALL 提供基础校验命令检查 OpenSpec 结构、归档任务完成度、算法及生产构建，并提供包含浏览器交互的完整校验命令；未运行或受环境限制的检查必须明确记录。

#### Scenario: 验证待交付迭代

- **WHEN** 开发者运行 npm run check:full
- **THEN** 依次运行规格与归档校验、算法测试、类型与构建检查和浏览器测试，失败的命令使本次整体校验失败

### Requirement: 本地 Git 版本历史

项目 SHALL 跟踪源码、锁文件、项目协作指引和 OpenSpec 工件，排除依赖、构建及本地环境文件；按逻辑迭代保留本地提交，连接远程与推送须由用户另行指定。

#### Scenario: 查看完成的迭代

- **WHEN** 开发者查看 Git 历史和对应归档
- **THEN** 能找到项目基线与本轮流程接入的独立提交，并查阅需求、实现及验证内容
