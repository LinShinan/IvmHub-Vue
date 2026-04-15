<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="点位名称" prop="nodeName">
        <el-input
          v-model="queryParams.nodeName"
          placeholder="请输入点位名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="区域" prop="regionId">
        <el-select v-model="queryParams.regionId" placeholder="请选择区域" clearable @focus="getRegionList">
          <el-option
            v-for="item in regionList"
            :key="item.id"
            :label="item.regionName"
            :value="item.id"
          ></el-option>
        </el-select>
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
          v-hasPermi="['manage:node:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:node:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:node:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:node:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="nodeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="50px" />
      <el-table-column label="点位名称" align="center" prop="nodeName" width="150px" />
      <el-table-column label="商圈类型" align="center" prop="businessType" width="100px">
        <template #default="scope">
          <dict-tag :options="business_type" :value="scope.row.businessType"/>
        </template>
      </el-table-column>
      <el-table-column label="所在区域" align="center" prop="region.regionName" />
      <el-table-column label="合作商" align="center" prop="partner.partnerName" />
      <el-table-column label="详细地址" align="left" prop="address" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="getVmInfo(scope.row)" v-hasPermi="['manage:machine:list']">查看详情</el-button>
          <el-button link type="success" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:node:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:node:remove']">删除</el-button>
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

    <!-- 添加或修改点位管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="nodeRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="点位名称" prop="nodeName">
          <el-input v-model="form.nodeName" placeholder="请输入点位名称" />
        </el-form-item>
       
        <el-form-item label="商圈类型" prop="businessType">
          <el-select v-model="form.businessType" placeholder="请选择商圈类型">
            <el-option
              v-for="dict in business_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所在区域" prop="regionId">
          <el-select v-model="form.regionId" placeholder="请选择区域" >
            <el-option
              v-for="item in regionList"
              :key="item.id"
              :label="item.regionName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="所属合作商" prop="partnerId"> 
          <el-select v-model="form.partnerId" placeholder="请选择合作商">
            <el-option
              v-for="item in partnerList"
              :key="item.id"
              :label="item.partnerName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>

         <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
     <el-dialog title="查看详情" v-model="vmOpen" width="600px" append-to-body>
      <el-table :data="vmList">
        <el-table-column label="设备编号" align="center" prop="innerCode" />
        <el-table-column label="设备状态" align="center" prop="vmStatus">
          <template #default="scope">
            <dict-tag :options="vm_status" :value="scope.row.vmStatus"/>
          </template>
        </el-table-column>
        <el-table-column label="最后一次供货时间" align="center" prop="lastSupplyTime">
          <template #default="scope">
            <span>{{ parseTime(scope.row.lastSupplyTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
  </div>
</template>

<script setup name="Node">
import { listNode, getNode, delNode, addNode, updateNode } from "@/api/manage/node";
import { ref, reactive, getCurrentInstance, onMounted, computed } from "vue";
import { listAllRegion } from "@/api/manage/region";
import { listAllPartner } from "@/api/manage/partner";
import { listAllMachineBy } from "@/api/manage/machine";


const { proxy } = getCurrentInstance();
const { business_type, vm_status } = proxy.useDict('business_type', 'vm_status');

const nodeList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const open = ref(false);
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  nodeName: undefined,
  regionId: undefined,
  businessType: undefined,
  partnerId: undefined,
  address: undefined,
});
const form = reactive({
  id: undefined,
  nodeName: undefined,
  businessType: undefined,
  regionId: undefined,
  partnerId: undefined,
  address: undefined,
});
const rules = reactive({
  nodeName: [{ required: true, message: "点位名称不能为空", trigger: "blur" }],
  businessType: [{ required: true, message: "商圈类型不能为空", trigger: "blur" }],
  regionId: [{ required: true, message: "所在区域不能为空", trigger: "blur" }],
  partnerId: [{ required: true, message: "所属合作商不能为空", trigger: "blur" }],
  address: [{ required: true, message: "详细地址不能为空", trigger: "blur" }],
});
const regionList = ref([]);

function getRegionList(){
  listAllRegion().then(response => {
    regionList.value = response.rows;
  });
}

const partnerList=ref([]);
function getPartnerList(){
  listAllPartner().then(response => {
    partnerList.value = response.rows;
  });
}

/** 合作商 Map */
const partnerMap = computed(() => {
  const map = {};
  if (partnerList.value && partnerList.value.length > 0) {
    partnerList.value.forEach(item => {
      map[String(item.id)] = item.partnerName;
    });
  }
  return map;
});

const machineParam = ref({});
const vmList = ref([]);
const vmOpen = ref(false);
/** 查看详情按钮操作 */
function getVmInfo(row) {
  reset();
  const _id = row.id || ids.value;
  machineParam.value={nodeId:_id};
  listAllMachineBy(machineParam.value).then(response => {
    vmList.value = response.rows;
    vmOpen.value = true;
    title.value = "查看详情";
  });
}

/** 查询点位管理列表 */
function getList() {
  loading.value = true;
  listNode(queryParams).then(response => {
    nodeList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮操作 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.id = undefined;
  form.nodeName = undefined;
  form.businessType = undefined;
  form.regionId = undefined;
  form.partnerId = undefined;
  form.address = undefined;
  proxy.resetForm("nodeRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加点位管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getNode(_id).then(response => {
    Object.assign(form, response.data);
    open.value = true;
    title.value = "修改点位管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["nodeRef"].validate(valid => {
    if (valid) {
      if (form.id !== undefined) {
        updateNode(form).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addNode(form).then(response => {
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
  proxy.$modal.confirm('是否确认删除点位管理编号为"' + _ids + '"的数据项？').then(function() {
    return delNode(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("manage/node/export", {
    ...queryParams,
  }, `node_${new Date().getTime()}.xlsx`);
}

onMounted(() => {
  getRegionList();
  getPartnerList();
  getList();
});

</script>
