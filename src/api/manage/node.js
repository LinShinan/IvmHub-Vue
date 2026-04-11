import request from '@/utils/request'

// 查询点位管理列表
export function listNode(query) {
  return request({
    url: '/manage/node/list',
    method: 'get',
    params: query
  })
}

//根据条件查询所有点位管理
export function listAllNode(query){
  return request({
    url: '/manage/node/all',
    method: 'get',
    params: query
  })
}

// 查询点位管理详细
export function getNode(id) {
  return request({
    url: '/manage/node/' + id,
    method: 'get'
  })
}

// 新增点位管理
export function addNode(data) {
  return request({
    url: '/manage/node',
    method: 'post',
    data: data
  })
}

// 修改点位管理
export function updateNode(data) {
  return request({
    url: '/manage/node',
    method: 'put',
    data: data
  })
}

// 删除点位管理
export function delNode(id) {
  return request({
    url: '/manage/node/' + id,
    method: 'delete'
  })
}
