let activeEffect

export function effect(fn) {
  const effectFn=()=>{
    console.log('调用');
    cleanup(effectFn)
    // 当 effectFn 执行时，将其设置为当前激活的副作用函数
    activeEffect=effectFn
    fn()
  }

  // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps=[]
  // 执行副作用函数
  effectFn()
}

function cleanup(effectFn){
  for(let i=0;i<effectFn.deps.length;i++){
    const deps=effectFn.deps[i]
    deps?.delete(effectFn)
  }

  effectFn.deps.length=0
}

// 存储副作用函数的桶
const bucket = new WeakMap()

// 原始数据
const data = {
  bool:true,
  str:'obj str'
}

const track = (target, key) => {
  // 没有 activeEffect，直接 return
  if (!activeEffect) return target[key]
  // 根据 target 从“桶”中取得 depsMap，它也是一个 Map 类型：key --> effects
  let depsMap = bucket.get(target)
  // 如果不存在 depsMap，那么新建一个 Map 并与 target 关联
  if (!depsMap) bucket.set(target, (depsMap = new Map()))
  // 再根据 key 从 depsMap 中取得 deps，它是一个 Set 类型，
  // 里面存储着所有与当前 key 相关联的副作用函数：effects
  let deps = depsMap.get('key')
  // 如果 deps 不存在，同样新建一个 Set 并与 key 关联
  if (!deps) depsMap.set(key, (deps = new Set()))
  // 将当前激活的副作用函数添加到“桶”里
  deps.add(activeEffect)
  // 将其添加到 activeEffect.deps 数组中
  activeEffect.deps.push(deps) // 新增
  console.log('activeEffect',[...activeEffect.deps]);
}

const trigger = (target, key) => {
  // 根据 target 从桶中取得 depsMap，它是 key --> effects
  const depsMap = bucket.get(target)
  if (!depsMap) return true
  // 根据 key 取得所有副作用函数 effects
  const effects = depsMap.get(key)
  // 执行副作用函数
  const effectsToRun = new Set(effects)
  effectsToRun.forEach(effectFn => effectFn())
}

// 对原始数据的代理
export const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    console.log('get',{ target, key })

    track(target, key)

    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    console.log('set',{ target, key })
    // 设置属性值
    target[key] = newVal

    trigger(target, key)

    return true
  },
})
