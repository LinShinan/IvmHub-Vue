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
      <!-- <el-table-column label="主键" align="center" prop="id" /> -->
      <el-table-column label="设备编号" align="center" prop="innerCode" />
       <el-table-column label="设备型号" align="center" prop="vmTypeId">
        <template #default="scope">
          {{ vmTypeMap[scope.row.vmTypeId] || scope.row.vmTypeId }}
        </template>
      </el-table-column>
      <el-table-column label="详细地址" align="left" prop="addr" show-overflow-tooltip />
      <el-table-column label="合作商" align="center" prop="partnerId">
        <template #default="scope">
          {{ partnerMap[scope.row.partnerId] || scope.row.partnerId }}
        </template>
      </el-table-column>
      <el-table-column label="设备状态" align="center" prop="vmStatus">
        <template #default="scope">
          <dict-tag :options="vm_status" :value="scope.row.vmStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope"> 
          <el-button link type="primary" icon="Monitor" @click="handleGoods(scope.row)" v-hasPermi="['manage:machine:edit']">货道</el-button>
          <el-button link type="info" icon="EditPen" @click="handlePolicy(scope.row)" v-hasPermi="['manage:machine:edit']">策略</el-button>
          <el-button link type="success" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:machine:edit']">修改</el-button>
          <!-- <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:machine:remove']">删除</el-button> -->
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

    <!-- 添加或修改设备管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="machineRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="设备编号" prop="innerCode">
          <span>{{ form.innerCode==null?"系统自动生成": form.innerCode }}</span>
        </el-form-item>
        <el-form-item label="供货时间" prop="lastSupplyTime" v-if="form.id!=null">
          <span>{{ parseTime(form.lastSupplyTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </el-form-item>
        <el-form-item label="设备类型" prop="vmTypeId" v-if="form.id!=null">
          <span>{{ vmTypeMap[form.vmTypeId] || form.vmTypeId }}</span>
        </el-form-item>

        <el-form-item label="设备数量" prop="channelMaxCapacity" v-if="form.id!=null">
          <span>{{ form.channelMaxCapacity }}</span>
        </el-form-item>
        <el-form-item label="点位" prop="nodeId">
          <el-select v-model="form.nodeId" placeholder="请选择点位">
            <el-option v-for="item in nodeList" :key="item.id" :label="item.nodeName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="合作商" prop="partnerId" v-if="form.id!=null">
          <span>{{ partnerMap[form.partnerId] || form.partnerId }}</span>
        </el-form-item>
        <el-form-item label="所属区域" prop="regionId" v-if="form.id!=null">
          <span>{{ regionMap[form.regionId] || form.regionId }}</span>
        </el-form-item>

        <el-form-item label="设备地址" prop="addr" v-if="form.innerCode!=null">
          <span>{{ form.addr }}</span>
        </el-form-item>

        <el-form-item label="设备型号" prop="vmTypeId" v-if="form.id==null">
          <el-select v-model="form.vmTypeId" placeholder="请选择设备型号">
            <el-option v-for="item in vmTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更换策略对话框 -->
    <el-dialog title="更换策略" v-model="policyOpen" width="500px" append-to-body> 
      <el-form ref="policyRef" :model="policyForm" :rules="policyRules" label-width="80px"> 
        <el-form-item label="设备编号">
          <span>{{ policyForm.innerCode }}</span>
        </el-form-item>
        <el-form-item label="选择策略" prop="policyId">
          <el-select v-model="policyForm.policyId" placeholder="请选择策略" style="width: 100%">
            <el-option 
              v-for="item in policyList" 
              :key="item.policyId" 
              :label="item.policyName + ' (' + item.discount + '折)'" 
              :value="item.policyId" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitPolicyForm">确 定</el-button>
          <el-button @click="cancelPolicy">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 货道组件 -->
    <ChannelDialog :goodVisible="goodVisible" :goodData="goodData" @handleCloseGood="handleCloseGood"></ChannelDialog>
  </div>
</template>

<script setup name="Machine">
import { listMachine, getMachine, delMachine, addMachine, updateMachine } from "@/api/manage/machine";
import { listAllVmType } from "@/api/manage/vmType";
import { listAllPartner } from "@/api/manage/partner";
import { listAllNode } from "@/api/manage/node";
import { listAllRegion } from "@/api/manage/region";
import {listAllPolicyBy, getPolicy} from "@/api/manage/policy";

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

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getMachine(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改设备管理";
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

const policyOpen = ref(false);
const policyForm = ref({});
const policyList = ref([]);
const policyRules = {
  policyId: [
    { required: true, message: "策略不能为空", trigger: "blur" }
  ]
};

/** 查询所有策略列表 */
function getPolicyList() {
  listAllPolicyBy(null).then(response => {
    policyList.value = response.rows;
  });
}

function handlePolicy(row){
  const _id = row.id || ids.value;
  
  // 先获取设备信息
  getMachine(_id).then(machineResponse => {
    const machineData = machineResponse.data;
    
    // 给 policyForm 赋值
    policyForm.value = {
      id: machineData.id,
      innerCode: machineData.innerCode,
      policyId: machineData.policyId
    };
    
    // 再获取策略列表
    listAllPolicyBy(null).then(policyResponse => {
      policyList.value = policyResponse.rows;
      policyOpen.value = true;
    });
  });
}

/** 提交策略表单 */
function submitPolicyForm() {
  proxy.$refs["policyRef"].validate(valid => {
    if (valid) {
      // 构建更新数据，只更新策略相关字段
      const updateData = {
        id: policyForm.value.id,
        innerCode: policyForm.value.innerCode,
        policyId: policyForm.value.policyId
      };
      updateMachine(updateData).then(response => {
        proxy.$modal.msgSuccess("策略修改成功");
        policyOpen.value = false;
        getList();
      });
    }
  });
}

/** 取消策略表单 */
function cancelPolicy() {
  policyOpen.value = false;
  policyForm.value = {};
}

// 货道组件
import ChannelDialog from './components/ChannelDialog.vue';
const goodVisible = ref(false); //货道弹层显示隐藏
const goodData = ref({}); //货道信息用来拿取 vmTypeId和innerCode
// 打开货道弹层
const handleGoods = (row) => {
  goodVisible.value = true;
  goodData.value = row;
};
// 关闭货道弹层
const handleCloseGood = () => {
  goodVisible.value = false;
};




onMounted(() => {
  getVmTypeList();
  getPartnerList();
  getNodeList();
  getRegionList();
  getPolicyList();
  getList();
});

</script>


<style lang="scss" scoped src="./index.scss"></style>