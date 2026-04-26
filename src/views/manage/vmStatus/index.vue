<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="设备编号" prop="innerCode">
        <el-input
          v-model="queryParams.innerCode"
          placeholder="请输入设备编号"
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
          v-hasPermi="['manage:machine:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manage:machine:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manage:machine:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manage:machine:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="machineList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="50px" />
      <el-table-column label="设备编号" align="center" prop="innerCode" />
       <el-table-column label="设备型号" align="center" prop="vmTypeId">
        <template #default="scope">
          {{ vmTypeMap[scope.row.vmTypeId] || scope.row.vmTypeId }}
        </template>
      </el-table-column>
      <el-table-column label="详细地址" align="left" prop="addr" show-overflow-tooltip />
      <!-- <el-table-column label="合作商" align="center" prop="partnerId">
        <template #default="scope">
          {{ partnerMap[scope.row.partnerId] || scope.row.partnerId }}
        </template>
      </el-table-column> -->
      <el-table-column label="运营状态" align="center" prop="vmStatus">
        <template #default="scope">
          <dict-tag :options="vm_status" :value="scope.row.vmStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="设备状态" align="center" prop="runningStatus">
        <template #default="scope">
            <span v-if="scope.row.runningStatus!=null">
                {{ JSON.parse(scope.row.runningStatus).status==true? '正常' : '异常' }}
            </span>
            <span v-else>异常</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="getInfo(scope.row)" v-hasPermi="['manage:machine:query']">查看详情</el-button>
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

    <!-- 查看详情对话框 -->
    <el-dialog title="查看详情" v-model="viewOpen" width="500px" append-to-body>
        <el-row :gutter="20">
          <el-col :span="6">销售量：{{ vmDetailsForm.salesVolume }}</el-col>
          <el-col :span="6">销售额：{{ vmDetailsForm.salesAmount}}元</el-col>
          <el-col :span="6">补货次数：{{ vmDetailsForm.supplyCount }}次</el-col>
          <el-col :span="6">维修次数：{{ vmDetailsForm.repairCount}}次</el-col>
        </el-row>
      <h3>商品销量（月）</h3>
      <el-table :data="vmDetailsForm.productSales" style="width: 100%">
        <el-table-column label="商品" prop="skuName" />
        <el-table-column label="销量" prop="total" />
      </el-table>
  
    </el-dialog>
  </div>
</template>

<script setup name="Machine">
import { listMachine, getMachine, delMachine, addMachine, updateMachine,getVmDetails } from "@/api/manage/machine";
import { listAllVmType } from "@/api/manage/vmType";
import { listAllPartner } from "@/api/manage/partner";
import { listAllNode } from "@/api/manage/node";
import { listAllRegion } from "@/api/manage/region";


const { proxy } = getCurrentInstance();
const { vm_status } = proxy.useDict('vm_status');

const machineList = ref([]);
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
    innerCode: null,
    nodeId: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    vmStatus: null,
    runningStatus: null,
    policyId: null,
  },
  rules: {
    nodeId: [
      { required: true, message: "点位Id不能为空", trigger: "blur" }
    ],
    vmTypeId: [
      { required: true, message: "设备型号不能为空", trigger: "blur" }
    ],
    createTime: [
      { required: true, message: "创建时间不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询设备管理列表 */
function getList() {
  loading.value = true;
  listMachine(queryParams.value).then(response => {
    machineList.value = response.rows;
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
    innerCode: null,
    channelMaxCapacity: null,
    nodeId: null,
    addr: null,
    lastSupplyTime: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    vmStatus: null,
    runningStatus: null,
    longitudes: null,
    latitude: null,
    clientId: null,
    policyId: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("machineRef");
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
  title.value = "添加设备管理";
}

const viewOpen=ref(false);
const vmDetailsForm =ref({});
/** 查看详情操作 */
function getInfo(row) {
  reset();  
  const _innerCode = row.innerCode;
  getVmDetails(_innerCode).then(response => {
    vmDetailsForm.value = response.data;
    viewOpen.value = true;
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["machineRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateMachine(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMachine(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除设备管理编号为"' + _ids + '"的数据项？').then(function() {
    return delMachine(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/machine/export', {
    ...queryParams.value
  }, `machine_${new Date().getTime()}.xlsx`)
}

const vmTypeList = ref([]);
/** 查询所有设备类型管理列表 */
function getVmTypeList() {
  listAllVmType().then(response => {
    vmTypeList.value = response.rows;
  });
}

// 将设备型号列表转换为 Map 对象，用于快速查找 { id: name }
const vmTypeMap = computed(() => {
  const map = {};
  vmTypeList.value.forEach(item => {
    map[item.id] = item.name;
  });
  return map;
});

const partnerList = ref([]);
/** 查询所有合作商管理列表 */
function getPartnerList() {
  listAllPartner().then(response => {
    partnerList.value = response.rows;
  });
}

// 将合作商列表转换为 Map 对象，用于快速查找 { id: partnerName }
const partnerMap = computed(() => {
  const map = {};
  partnerList.value.forEach(item => {
    map[item.id] = item.partnerName;
  });
  return map;
});

const nodeList = ref([]);
/** 查询所有点位管理列表 */
function getNodeList() {
  listAllNode(null).then(response => {
    nodeList.value = response.rows;
  });
}

const regionList = ref([]);
/** 查询所有区域管理列表 */
function getRegionList() {
  listAllRegion().then(response => {
    regionList.value = response.rows;
  });
}

// 将区域列表转换为 Map 对象，用于快速查找 { id: regionName }
const regionMap = computed(() => {
  const map = {};
  regionList.value.forEach(item => {
    map[item.id] = item.regionName;
  });
  return map;
});


onMounted(() => {
  getVmTypeList();
  getPartnerList();
  getNodeList();
  getRegionList();
  getList();
});

</script>
