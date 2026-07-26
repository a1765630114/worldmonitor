// api/index.js — 将所有 /api/* 请求分发到对应的处理文件
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 移除 /api/ 前缀
  const route = pathname.replace(/^\/api\//, '');

  if (!route || route === 'index') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  // 尝试加载 .js 或 .mjs 处理模块
  try {
    let module;
    try {
      module = await import(`./${route}.js`);
    } catch (_) {
      module = await import(`./${route}.mjs`);
    }
    const handlerFn = module.default || module;
    if (typeof handlerFn === 'function') {
      await handlerFn(req, res);
    } else {
      throw new Error(`Handler for ${route} is not a function`);
    }
  } catch (err) {
    res.statusCode = 404;
    res.end(`Not Found: ${route}`);
  }
}
