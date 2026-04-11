<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="70px">
      <el-form-item label="合作商名称" prop="partnerName">
        <el-input
          v-model="queryParams.partnerName"
          placeholder="请输入合作商名称"
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
          v-hasPermi="['manage:partner:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:partner:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:partner:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:partner:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="partnerList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" width="60"/>
      <el-table-column label="合作商名称" align="center" prop="partnerName" min-width="100" show-overflow-tooltip />
      <el-table-column label="账号" align="center" prop="account" min-width="100" show-overflow-tooltip />
      <el-table-column label="点位数" align="center" prop="nodeCount" width="90"/>
      <el-table-column label="分成比例" align="center" prop="profitRatio" width="90">
        <template #default="scope">
          <el-tag type="success" effect="light" size="small">{{ scope.row.profitRatio }}%</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="联系人" align="center" prop="contactPerson" width="90" show-overflow-tooltip />
      <el-table-column label="联系电话" align="center" prop="contactPhone" width="120" show-overflow-tooltip />
      <el-table-column label="操作" align="center" min-width="200" class-name="small-padding fixed-width">
        <template #default="scope">
          <div class="action-buttons">
            <div class="button-row">
              <el-button link type="warning" icon="Key" size="small" @click="resetPassword(scope.row)" v-hasPermi="['manage:partner:edit']">重置密码</el-button>
              <el-button link type="primary" icon="View" size="small" @click="getDetail(scope.row)" v-hasPermi="['manage:partner:query']">查看详情</el-button>
              <el-button link type="primary" icon="Edit" size="small" @click="handleUpdate(scope.row)" v-hasPermi="['manage:partner:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" size="small" @click="handleDelete(scope.row)" v-hasPermi="['manage:partner:remove']">删除</el-button>
            </div>
          </div>
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

    <!-- 添加或修改合作商管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="partnerRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="合作商名称" prop="partnerName">
          <el-input v-model="form.partnerName" placeholder="请输入合作商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime" v-if="form.id!=null">
          {{ form.createTime }} 
        </el-form-item>
        <el-form-item label="分成比例" prop="profitRatio">
          <el-input v-model="form.profitRatio" placeholder="请输入分成比例" />
        </el-form-item>
        <el-form-item label="账号" prop="account" v-if="form.id==null">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="form.id==null">
          <el-input v-model="form.password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
    title="合作商详情"
    v-model="showDetailRef"
    width="650px"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
    class="partner-detail-dialog"
  >
    <!-- 自定义表格样式详情 -->
    <div class="detail-grid">
      <div class="detail-grid-row">
        <div class="detail-grid-item">
          <div class="detail-grid-label">
            <span class="label-icon">📋</span>
            合作商名称
          </div>
          <div class="detail-grid-value">{{ form.partnerName || '-' }}</div>
        </div>
        <div class="detail-grid-item">
          <div class="detail-grid-label">
            <span class="label-icon">👤</span>
            联系人
          </div>
          <div class="detail-grid-value">{{ form.contactPerson || '-' }}</div>
        </div>
      </div>
      <div class="detail-grid-row">
        <div class="detail-grid-item">
          <div class="detail-grid-label">
            <span class="label-icon">📞</span>
            联系电话
          </div>
          <div class="detail-grid-value">{{ form.contactPhone || '-' }}</div>
        </div>
        <div class="detail-grid-item highlight-item">
          <div class="detail-grid-label">
            <span class="label-icon">💰</span>
            分成比例
          </div>
          <div class="detail-grid-value highlight-value">{{ form.profitRatio ? `${form.profitRatio}%` : '-' }}</div>
        </div>
      </div>
    </div>
  </el-dialog>
  </div>
</template>

<script setup name="Partner">
import { listPartner, getPartner, delPartner, addPartner, updatePartner,resetPartnerPwd } from "@/api/manage/partner";

const { proxy } = getCurrentInstance();

const partnerList = ref([]);
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
    partnerName: null,
  },
  rules: {
    partnerName: [
      { required: true, message: "合作商名称不能为空", trigger: "blur" }
    ],
    contactPerson: [
      { required: true, message: "联系人不能为空", trigger: "blur" }
    ],
    contactPhone: [
      { required: true, message: "联系电话不能为空", trigger: "blur" }
    ],
    profitRatio: [
      { required: true, message: "分成比例不能为空", trigger: "blur" }
    ],
    account: [
      { required: true, message: "账号不能为空", trigger: "blur" }
    ],
    password: [
      { required: true, message: "密码不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询合作商管理列表 */
function getList() {
  loading.value = true;
  listPartner(queryParams.value).then(response => {
    partnerList.value = response.rows;
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
    partnerName: null,
    contactPerson: null,
    contactPhone: null,
    profitRatio: null,
    account: null,
    password: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null
  };
  proxy.resetForm("partnerRef");
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
  title.value = "添加合作商管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getPartner(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改合作商管理";
  });
}

const showDetailRef = ref(false);
/** 查看详情 */
function getDetail(row){
  reset();
  const _id = row.id;

  getPartner(_id).then(response =>{
    form.value=response.data;
    showDetailRef.value=true;
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["partnerRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updatePartner(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPartner(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除合作商管理编号为"' + _ids + '"的数据项？').then(function() {
    return delPartner(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 重置密码按钮操作 */
function resetPassword(row){
  const _id = row.id;
   proxy.$modal.confirm('是否确认重置合作商管理编号为"' + _id + '"的密码？').then(function() {
    return resetPartnerPwd(_id);
  }).then(() => {
    proxy.$modal.msgSuccess("重置成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/partner/export', {
    ...queryParams.value
  }, `partner_${new Date().getTime()}.xlsx`)
}

getList();
</script>


<style scoped>
/* 详情网格容器 */
.detail-grid {
  padding: 8px 0;
}

/* 网格行 */
.detail-grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-grid-row:last-child {
  margin-bottom: 0;
}

/* 网格项 - 基础样式 */
.detail-grid-item {
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border: 1px solid #e8ecf4;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.detail-grid-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 0 0 4px;
}

.detail-grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

/* 高亮项 - 分成比例 */
.detail-grid-item.highlight-item {
  background: linear-gradient(135deg, #fff5f0 0%, #ffffff 100%);
  border-color: #ffd4c4;
}

.detail-grid-item.highlight-item::before {
  background: linear-gradient(180deg, #ff6b6b 0%, #ffa07a 100%);
}

.detail-grid-item.highlight-item:hover {
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

/* 标签样式 */
.detail-grid-label {
  font-size: 13px;
  color: #8b95a5;
  font-weight: 500;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 标签图标 */
.label-icon {
  font-size: 16px;
  display: inline-block;
}

/* 值样式 */
.detail-grid-value {
  font-size: 17px;
  color: #2d3748;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-all;
}

/* 高亮值样式 */
.detail-grid-value.highlight-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

/* 对话框样式优化 */
:deep(.partner-detail-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  margin: 0;
  border-radius: 8px 8px 0 0;
}

:deep(.partner-detail-dialog .el-dialog__title) {
  color: #ffffff;
  font-weight: 600;
  font-size: 18px;
}

:deep(.partner-detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
  font-size: 20px;
}

:deep(.partner-detail-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #ffd4c4;
}

:deep(.partner-detail-dialog .el-dialog__body) {
  padding: 24px;
}

/* 操作按钮容器 - 两行布局更紧凑 */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.action-buttons .button-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* 操作按钮样式优化 */
.action-buttons .el-button {
  padding: 2px 6px;
  font-size: 12px;
  white-space: nowrap;
}

/* 分成比例标签样式 */
:deep(.el-tag--success) {
  font-weight: 600;
}

/* 表格行悬停效果 */
:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

/* 操作列内边距优化 */
:deep(.el-table .small-padding .cell) {
  padding: 0 4px;
}
</style>