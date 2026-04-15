import request from '@/utils/request'

// 查询设备管理列表
export function listMachine(query) {
  return request({
    url: '/manage/machine/list',
    method: 'get',
    params: query
  })
}
export function listAllMachineBy(query) {
  return request({
    url: '/manage/machine/all',
    method: 'get',
    params: query
  })
}

// 查询设备管理详细
export function getMachine(id) {
  return request({
    url: '/manage/machine/' + id,
    method: 'get'
  })
}

// 新增设备管理
export function addMachine(data) {
  return request({
    url: '/manage/machine',
    method: 'post',
    data: data
  })
}

// 修改设备管理
export function updateMachine(data) {
  return request({
    url: '/manage/machine',
    method: 'put',
    data: data
  })
}

// 删除设备管理
export function delMachine(id) {
  return request({
    url: '/manage/machine/' + id,
    method: 'delete'
  })
}
