<template>
  <!-- 货道弹层 -->
  <el-dialog
    width="940px"
    title="货道设置"
    v-model="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @open="handleGoodOpen"
    @close="handleGoodcClose"
  >
    <div class="vm-config-channel-dialog-wrapper">
      <div class="channel-basic">
        <span class="vm-row">货道行数：{{ vmType.vmRow }}</span>
        <span class="vm-col">货道列数：{{ vmType.vmCol }}</span>
        <span class="channel-max-capacity"
          >货道容量（个）：{{ vmType.channelMaxCapacity }}</span
        >
      </div>
      <el-scrollbar ref="scroll" v-loading="listLoading" class="scrollbar">
        <el-row
          v-for="vmRowIndex in vmType.vmRow"
          :key="vmRowIndex"
          type="flex"
          :gutter="16"
          class="space"
        >
          <el-col
            v-for="vmColIndex in vmType.vmCol"
            :key="vmColIndex"
            :span="vmType.vmCol <= 5 ? 5 : 12"
          >
            <ChannelDialogItem
              :current-index="computedCurrentIndex(vmRowIndex, vmColIndex)"
              :channel="channels[computedCurrentIndex(vmRowIndex, vmColIndex)]"
              @openSetSkuDialog="openSetSkuDialog"
              @openRemoveSkuDialog="openRemoveSkuDialog"
            >
            </ChannelDialogItem>
          </el-col>
        </el-row>
      </el-scrollbar>
      <el-icon
        v-if="vmType.vmCol > 5"
        class="arrow arrow-left"
        :class="scrollStatus === 'LEFT' ? 'disabled' : ''"
        @click="handleClickPrevButton"
        ><ArrowLeft
      /></el-icon>
      <el-icon
        v-if="vmType.vmCol > 5"
        class="arrow arrow-right"
        :class="scrollStatus === 'RIGHT' ? 'disabled' : ''"
        @click="handleClickNextButton"
        ><ArrowRight
      /></el-icon>
    </div>
    <div class="dialog-footer">
      <el-button
        type="primary"
        class="el-button--primary1"
        @click="handleClick"
      >
        确认
      </el-button>
    </div>

    <!-- 商品选择 -->
    <el-dialog
      width="858px"
      title="选择商品"
      v-model="skuDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      append-to-body
      @open="handleListOpen"
      @close="handleListClose"
    >
      <div class="vm-select-sku-dialog-wrapper">
        <!-- 搜索区 -->
        <el-form
          ref="form"
          class="search"
          :model="listQuery"
          :label-width="formLabelWidth"
        >
          <el-form-item label="商品名称：">
            <el-row type="flex" justify="space-between">
              <el-col>
                <el-input
                  v-model="listQuery.skuName"
                  placeholder="请输入"
                  clearable
                  class="sku-name"
                  @input="resetPageIndex"
                />
              </el-col>
              <el-col>
                <el-button
                  type="primary"
                  class="el-button--primary1"
                  @click="handleListOpen"
                >
                  <el-icon><Search /></el-icon>&nbsp;&nbsp;查询
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
        <el-scrollbar
          ref="scroll2"
          v-loading="listSkuLoading"
          class="scrollbar"
        >
          <!-- 空状态提示 -->
          <el-empty
            v-if="!listSkuLoading && (!listSkuData.rows || listSkuData.rows.length === 0)"
            description="暂无商品数据"
            :image-size="100"
          />
          
          <!-- 商品列表 -->
          <el-row v-else :gutter="20">
            <el-col
              v-for="(item, index) in listSkuData.rows"
              :key="item.skuId || index"
              :span="5"
            >
              <div class="item">
                <div
                  class="sku"
                  :class="index < 5 ? 'space' : ''"
                  @click="handleCurrentChange(index)"
                >
                  <img
                    v-show="currentRow.skuId === item.skuId"
                    class="selected"
                    src="@/assets/vm/selected.png"
                  />
                  <img class="img" :src="item.skuImage" />
                  <div class="name" :title="item.skuName">
                    {{ item.skuName }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-scrollbar>
      </div>
      <div class="dialog-footer">
        <el-button
          type="primary"
          class="el-button--primary1"
          @click="handleSelectClick"
        >
          确认
        </el-button>
      </div>
    </el-dialog>
    <!-- end -->
  </el-dialog>
  <!-- end -->
</template>
<script setup>
import { require } from '@/utils/validate';
const { proxy } = getCurrentInstance();
// 滚动插件
import { ElScrollbar } from 'element-plus';
// 接口
import {
  getGoodsList,
  getGoodsType,
  channelConfig,
} from '@/api/manage/channel';
import { listAllSkuBy } from '@/api/manage/sku';
// 内部组件
import ChannelDialogItem from './ChannelDialogItem.vue';
import { watch } from 'vue';
// 获取父组件参数
const props = defineProps({
  //  弹层隐藏显示
  goodVisible: {
    type: Boolean,
    default: false,
  },
  //   触发的货道信息
  goodData: {
    type: Object,
    default: () => {},
  },
});
// 获取父组件的方法
const emit = defineEmits(['handleCloseGood']);
// ******定义变量******
const visible = ref(false); //货道弹层显示隐藏
const scrollStatus = ref('LEFT');
const listLoading = ref(false);
const vmType = ref({ vmRow: 0, vmCol: 0, channelMaxCapacity: 0 }); //获取货道基本信息，默认值避免货道不显示
const channels = ref([]); //货道数据，初始化为空数组
const scroll = ref(null); //滚动条ref
// 监听货道弹层显示/隐藏
watch(
  () => props.goodVisible,
  (val) => {
    visible.value = val;
  }
);
// ******定义方法******
// 获取货道基本信息
const handleGoodOpen = () => {
  getVmType();
  channelList();
};
// 获取货道基本信息
const getVmType = async () => {
  try {
    const { data } = await getGoodsType(props.goodData.vmTypeId);
    if (data && data.vmRow > 0 && data.vmCol > 0) {
      vmType.value = data;
    } else {
      console.warn('vmType 数据无效，使用默认值');
      vmType.value = { vmRow: 5, vmCol: 6, channelMaxCapacity: 10 }; // 默认5x6货道
    }
  } catch (error) {
    console.error('获取货道基本信息失败:', error);
    vmType.value = { vmRow: 5, vmCol: 6, channelMaxCapacity: 10 }; // 默认值
  }
};
// 获取货道列表
const channelList = async () => {
  listLoading.value = true;
  try {
    const { data } = await getGoodsList(props.goodData.innerCode);
    // 确保 channels 数组有完整的数据
    const totalChannels = vmType.value.vmRow * vmType.value.vmCol;
    const channelsArray = [];
    for (let i = 0; i < totalChannels; i++) {
      if (data && data[i]) {
        channelsArray.push(data[i]);
      } else {
        const vmRowIndex = Math.floor(i / vmType.value.vmCol) + 1;
        const vmColIndex = (i % vmType.value.vmCol) + 1;
        channelsArray.push({
          id: null,
          innerCode: props.goodData.innerCode,
          channelCode: `${vmRowIndex}-${vmColIndex}`,
          skuId: 0,
          sku: undefined
        });
      }
    }
    channels.value = channelsArray;
  } catch (error) {
    console.error('获取货道列表失败:', error);
    const totalChannels = vmType.value.vmRow * vmType.value.vmCol;
    const channelsArray = [];
    for (let i = 0; i < totalChannels; i++) {
      const vmRowIndex = Math.floor(i / vmType.value.vmCol) + 1;
      const vmColIndex = (i % vmType.value.vmCol) + 1;
      channelsArray.push({
        id: null,
        innerCode: props.goodData.innerCode,
        channelCode: `${vmRowIndex}-${vmColIndex}`,
        skuId: 0,
        sku: undefined
      });
    }
    channels.value = channelsArray;
  }
  listLoading.value = false;
};
const computedCurrentIndex = (vmRowIndex, vmColIndex) => {
  return (vmRowIndex - 1) * vmType.value.vmCol + vmColIndex - 1;
};
// 关闭货道弹窗
const handleGoodcClose = () => {
  visible.value = false;
  emit('handleCloseGood');
};
const handleClickPrevButton = () => {
  scroll.value.wrapRef.scrollLeft = 0;
  scrollStatus.value = 'LEFT';
};

const handleClickNextButton = () => {
  scroll.value.wrapRef.scrollLeft = scroll.value.wrapRef.scrollWidth;
  scrollStatus.value = 'RIGHT';
};
const currentIndex = ref(0);
const channelCode = ref('');
const skuDialogVisible = ref(false); //添加商品弹层
// 删除选中的商品
const openRemoveSkuDialog = (index, code) => {
  currentIndex.value = index;
  channelCode.value = code;
  channels.value[currentIndex.value].skuId = '0';
  channels.value[currentIndex.value].sku = undefined;
};
// 添加商品
const listQuery = ref({
  skuName: '',
}); //搜索商品
const formLabelWidth = ref('90px'); // 表单标签宽度
const listSkuLoading = ref(false); //商品列表loading
const listSkuData = ref({ rows: [] }); //商品数据
const currentRow = ref({});
const pageCount = ref(0); //总页数
const channelModelView = ref({});
// 商品弹层列表
const handleListOpen = async () => {
  listSkuLoading.value = true;
  try {
    const query = { skuName: listQuery.value.skuName || undefined };
    const res = await listAllSkuBy(query);
    console.log('商品列表接口返回:', res);
    // 兼容不同响应格式
    if (res && res.rows) {
      listSkuData.value = { rows: res.rows };
    } else if (Array.isArray(res)) {
      listSkuData.value = { rows: res };
    } else {
      listSkuData.value = { rows: [] };
    }
    console.log('处理后的商品数据:', listSkuData.value);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    listSkuData.value = { rows: [] };
  } finally {
    listSkuLoading.value = false;
  }
};
// 打开商品选择弹层
const openSetSkuDialog = (index, code) => {
  currentIndex.value = index;
  channelCode.value = code;
  skuDialogVisible.value = true;
};
// 关闭商品详情
const handleListClose = () => {
  skuDialogVisible.value = false;
};
// 搜索
const resetPageIndex = () => {
  handleListOpen();
};
// 商品选择
const handleCurrentChange = (i) => {
  currentRow.value = listSkuData.value.rows[i];
};
// 确认商品选择
const handleSelectClick = (sku) => {
  handleListClose();
  channels.value[currentIndex.value].skuId = currentRow.value.skuId;
  channels.value[currentIndex.value].sku = {
    skuName: currentRow.value.skuName,
    skuImage: currentRow.value.skuImage,
  };
};
// 确认货道提交
const handleClick = async () => {
  // 过滤掉 id 为 null 的货道（数据库中不存在的货道）
  const validChannels = channels.value.filter(item => item.id !== null && item.id !== undefined);
  
  // 如果没有有效的货道数据，提示用户
  if (validChannels.length === 0) {
    proxy.$modal.msgWarning('没有可更新的货道数据');
    return;
  }
  
  channelModelView.value.innerCode = props.goodData.innerCode;
  channelModelView.value.channelList = validChannels.map((item) => {
    return {
      id: item.id, // 必须传递 id，后端 SQL 需要 where id = #{item.id}
      innerCode: props.goodData.innerCode,
      channelCode: item.channelCode,
      skuId: item.skuId,
    };
  });
  
  console.log('提交的货道数据:', channelModelView.value);
  
  const res = await channelConfig(channelModelView.value);
  if (res.code === 200) {
    proxy.$modal.msgSuccess('操作成功');
    visible.value = false;
    emit('handleCloseGood');
  }
};
</script>

<style lang="scss" scoped src="../index.scss"></style>
