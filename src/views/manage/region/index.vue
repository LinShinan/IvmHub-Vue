<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="区域名称" prop="regionName">
        <el-input
          v-model="queryParams.regionName"
          placeholder="请输入区域名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manage:region:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:region:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:region:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:region:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="regionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="50px" />
      <el-table-column label="区域名称" align="center" prop="regionName" />
      <el-table-column label="点位数" align="center" prop="nodeCount"/>
      <el-table-column label="备注说明" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="info" icon="View" @click="getDetail(scope.row)" v-hasPermi="['manage:node:list']">查看详情</el-button>
          <el-button link type="success" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:region:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:region:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改区域管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="regionRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="区域名称" prop="regionName">
          <el-input v-model="form.regionName" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 区域详情对话框 -->
    <el-dialog
      title="区域详情"
      v-model="detailOpen"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <!-- 基本信息卡片 -->
      <div class="detail-card">
        <div class="detail-item">
          <div class="detail-label">
            <span class="label-icon">📍</span>
            区域名称
          </div>
          <div class="detail-value">{{ detailData.regionName || '-' }}</div>
        </div>
      </div>

      <!-- 包含点位表格 -->
      <div class="detail-section">
        <div class="section-header">
          <span class="section-title">包含点位</span>
          <el-tag type="primary" effect="plain" size="small" class="count-tag">
            共 {{ detailData.nodeList?.length || 0 }} 个
          </el-tag>
        </div>
        
        <el-table 
          :data="detailData.nodeList" 
          border 
          style="width: 100%"
          :header-cell-style="{ background: '#f8f9fa', color: '#495057', fontWeight: '500', fontSize: '13px' }"
          :cell-style="{ fontSize: '13px' }"
        >
          <el-table-column label="序号" type="index" align="center" width="70" />
          <el-table-column label="点位名称" align="center" prop="nodeName" show-overflow-tooltip />
          <el-table-column label="设备数量" align="center" prop="deviceCount" width="100">
            <template #default="scope">
              <el-tag type="success" effect="light" size="small">{{ scope.row.deviceCount || 0 }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="default" @click="detailOpen = false">关 闭</el-button>
          <el-button type="primary" size="default" @click="detailOpen = false">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Region">
import { listRegion, getRegion, delRegion, addRegion, updateRegion } from "@/api/manage/region";
import {listAllNode} from "@/api/manage/node";

const { proxy } = getCurrentInstance();

const regionList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");



const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    regionName: null,
  },
  rules: {
    regionName: [
      { required: true, message: "区域名称不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注说明不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询区域管理列表 */
function getList() {
  loading.value = true;
  listRegion(queryParams.value).then(response => {
    regionList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    regionName: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null
  };
  proxy.resetForm("regionRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加区域管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getRegion(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改区域管理";
  });
}


const detailData = reactive({
  regionName: '',
  nodeList: [],
  vmList: []
});

// 详情对话框相关
const detailOpen = ref(false);

const listNodeParam=ref()
/** 查看详情 */
function getDetail(row) {
  detailData.regionName = row.regionName;
  // 调用专门的接口获取区域下的点位列表
  listNodeParam.value={regionId: row.id}
  listAllNode(listNodeParam.value).then(response => {
    detailData.nodeList = response.rows || [];
    detailOpen.value = true;
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["regionRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateRegion(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addRegion(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除区域管理编号为"' + _ids + '"的数据项？').then(function() {
    return delRegion(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/region/export', {
    ...queryParams.value
  }, `region_${new Date().getTime()}.xlsx`)
}

getList();
</script>

<style scoped>
/* 详情卡片容器 */
.detail-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  border-left: 3px solid #409eff;
}

/* 详情项 */
.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 标签样式 */
.detail-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 80px;
}

/* 标签图标 */
.label-icon {
  font-size: 14px;
}

/* 值样式 */
.detail-value {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
  line-height: 1.5;
}

/* 详情区域样式 */
.detail-section {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

/* 区域头部 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.count-tag {
  font-weight: 500;
  font-size: 12px;
}

/* 空数据样式 */
.empty-data {
  padding: 16px 0;
}

/* 对话框样式优化 */
:deep(.region-detail-dialog .el-dialog__header) {
  padding: 18px 20px;
  margin: 0;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
}

:deep(.region-detail-dialog .el-dialog__title) {
  color: #303133;
  font-weight: 600;
  font-size: 16px;
}

:deep(.region-detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #909399;
  font-size: 18px;
}

:deep(.region-detail-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #409eff;
}

:deep(.region-detail-dialog .el-dialog__body) {
  padding: 20px;
}

:deep(.region-detail-dialog .el-dialog__footer) {
  padding: 12px 20px 16px;
  border-top: 1px solid #e4e7ed;
}

/* 操作按钮颜色效果 */
.el-button--info.is-link {
  color: #909399;
}

.el-button--info.is-link:hover {
  color: #606266;
  background-color: rgba(144, 147, 153, 0.1);
}

.el-button--success.is-link {
  color: #67c23a;
}

.el-button--success.is-link:hover {
  color: #85ce61;
  background-color: rgba(103, 194, 58, 0.1);
}

.el-button--danger.is-link {
  color: #f56c6c;
}

.el-button--danger.is-link:hover {
  color: #f78989;
  background-color: rgba(245, 108, 108, 0.1);
}
</style>
