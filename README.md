# IvmHub-Vue

智能售货机物联网管理平台 — 前端

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.4.0-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.4.3-409EFF?style=flat-square&logo=element&logoColor=white)](https://element-plus.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1.7-F7D336?style=flat-square&logo=vuedotjs&logoColor=white)](https://pinia.vuejs.org/)
[![Vue Router](https://img.shields.io/badge/Vue_Router-4.2.5-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://router.vuejs.org/)
[![ECharts](https://img.shields.io/badge/ECharts-5.4.3-AA344D?style=flat-square&logo=apacheecharts&logoColor=white)](https://echarts.apache.org/)
[![Axios](https://img.shields.io/badge/Axios-0.27.2-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![Sass](https://img.shields.io/badge/Sass-1.69.5-CC6699?style=flat-square&logo=sass&logoColor=white)](https://sass-lang.com/)
[![Node](https://img.shields.io/badge/Node-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

## 相关仓库

| 项目 | 地址 |
|------|------|
| 后端 SpringBoot | [LinShinan/IvmHub](https://github.com/LinShinan/IvmHub) |
| 前端 Vue3 | [LinShinan/IvmHub-Vue](https://github.com/LinShinan/IvmHub-Vue) |

## 项目说明

本项目基于 [RuoYi-Vue](https://gitee.com/y_project/RuoYi-Vue) 3.8.7 构建，复用其认证鉴权、用户角色菜单、代码生成器等基础框架能力。**核心开发集中在 `manage` 业务模块**，即 `src/views/manage/` 和 `src/api/manage/`，与 RuoYi 原有代码完全解耦。

## manage 业务模块

| 模块 | 页面 | 接口 | 说明 |
|------|------|------|------|
| 合作商管理 | `views/manage/partner/` | `api/manage/partner.js` | 合作商 CRUD、密码重置 |
| 区域管理 | `views/manage/region/` | `api/manage/region.js` | 地理区域划分 |
| 点位管理 | `views/manage/node/` | `api/manage/node.js` | 售货机部署点位 |
| 策略管理 | `views/manage/policy/` | `api/manage/policy.js` | 补货 / 运营策略 |
| 人员管理 | `views/manage/emp/` | `api/manage/emp.js` | 运维、运营人员 |
| 设备类型 | `views/manage/vmType/` | `api/manage/vmType.js` | 售货机机型 |
| 商品类型 | `views/manage/skuClass/` | `api/manage/skuClass.js` | SKU 分类 |
| 商品管理 | `views/manage/sku/` | `api/manage/sku.js` | SKU 商品 |
| 设备管理 | `views/manage/machine/` | `api/manage/machine.js` + `channel.js` | 设备 + 货道配置 |
| 工单管理 | `views/manage/task/` | `api/manage/task.js` + `taskType.js` | 运营工单 + 运维工单 |
| 订单管理 | `views/manage/order/` | `api/manage/order.js` | 订单查询管理 |
| 首页看板 | `views/home/` | — | 销售统计、SKU 排行、异常设备图表 |

## 项目结构

```
src/
├── api/manage/          # ★ 业务接口（13 个模块）
├── views/manage/        # ★ 业务页面（12 个模块，73+ .vue 文件）
├── views/home/          # ★ 首页看板
├── components/          # 通用组件
├── layout/              # 布局
├── router/              # 路由
├── store/               # Pinia
└── utils/               # 工具函数
```

## 快速开始

```bash
git clone https://github.com/LinShinan/IvmHub-Vue.git
cd IvmHub-Vue
npm install
npm run dev                # http://localhost:80，API 代理 → 127.0.0.1:8080
npm run build:prod         # 生产构建 → dist/
```
