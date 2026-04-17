<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="策略名称" prop="policyName">
        <el-input
          v-model="queryParams.policyName"
          placeholder="请输入策略名称"
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
          v-hasPermi="['manage:policy:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:policy:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:policy:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:policy:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="policyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" type="index" width="50"/>
      <el-table-column label="策略名称" align="center" prop="policyName" />
      <el-table-column label="策略方案，如：90代表9折" align="center" prop="discount" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['manage:machine:list']">查看详情</el-button>
          <el-button link type="success" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:policy:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:policy:remove']">删除</el-button>
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

    <!-- 添加或修改策略管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="policyRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="策略名称" prop="policyName">
          <el-input v-model="form.policyName" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="策略方案" prop="discount">
          <el-input-number v-model="form.discount" placeholder="请输入" :min="1" :max="100" precision="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看策略详情对话框 -->
    <el-dialog title="策略详情" v-model="viewOpen" width="600px" append-to-body>
      <div class="policy-detail-container">
        <!-- 基本信息区域 -->
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="策略名称">
              {{ form.policyName }}
            </el-descriptions-item>
            <el-descriptions-item label="策略方案">
              {{ form.discount }}折
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 关联设备列表区域 -->
        <div class="detail-section mt-20">
          <h4 class="section-title">关联设备列表</h4>
          <el-table 
            :data="vmList" 
            style="width: 100%" 
            max-height="300" 
            border 
            stripe
            empty-text="暂无关联设备"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="设备编号" prop="innerCode" align="center" show-overflow-tooltip />
            <el-table-column label="点位地址" prop="addr" align="center" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Policy">
import { listPolicy, getPolicy, delPolicy, addPolicy, updatePolicy } from "@/api/manage/policy";
import {listAllMachineBy} from "@/api/manage/machine";


const { proxy } = getCurrentInstance();

const policyList = ref([]);
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
    policyName: null,
    discount: null,
  },
  rules: {
    policyName: [
      { required: true, message: "策略名称不能为空", trigger: "blur" }
    ],
    discount: [
      { required: true, message: "策略方案，如：80代表8折不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询策略管理列表 */
function getList() {
  loading.value = true;
  listPolicy(queryParams.value).then(response => {
    policyList.value = response.rows;
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
    policyId: null,
    policyName: null,
    discount: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("policyRef");
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
  ids.value = selection.map(item => item.policyId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加策略管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _policyId = row.policyId || ids.value
  getPolicy(_policyId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改策略管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["policyRef"].validate(valid => {
    if (valid) {
      if (form.value.policyId != null) {
        updatePolicy(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPolicy(form.value).then(response => {
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
  const _policyIds = row.policyId || ids.value;
  proxy.$modal.confirm('是否确认删除策略管理编号为"' + _policyIds + '"的数据项？').then(function() {
    return delPolicy(_policyIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/policy/export', {
    ...queryParams.value
  }, `policy_${new Date().getTime()}.xlsx`)
}

const vmList=ref([]);
const viewOpen=ref(false);
function handleView(row) {
  form.value=row;
  const _policyId = row.policyId || ids.value
 listAllMachineBy({
    policyId: _policyId
  }).then(response => {
    vmList.value=response.rows;
    viewOpen.value = true;
  });
}

getList();
</script>

<style scoped>
.policy-detail-container {
  padding: 10px;
}

.section-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 8px;
  line-height: 1.5;
}

.mt-20 {
  margin-top: 20px;
}

:deep(.el-descriptions__label) {
  width: 100px;
  justify-content: flex-end;
}
</style>
