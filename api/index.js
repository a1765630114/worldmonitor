// api/index.js — 统一的 API 入口，将所有 /api/* 请求分发到对应的处理文件
// 此文件作为 Vercel 的唯一 Serverless Function 入口，避免超过 12 个函数限制

// 声明为 Edge Runtime，与项目中其他 API 保持一致
export const config = {
  runtime: 'edge',
};

/**
 * 主请求处理函数
 * 根据请求路径动态加载对应的 API 处理模块
 */
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 移除 /api/ 前缀，获取路由路径（例如 "health" 或 "aviation/v1/flights"）
  const route = pathname.replace(/^\/api\//, '');

  // 如果路由为空或是 index 本身，返回 404
  if (!route || route === 'index') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  // 尝试加载对应的处理模块
  try {
    // 先尝试加载 .js 文件，如果失败则尝试 .mjs
    let module;
    try {
      module = await import(`./${route}.js`);
    } catch (_) {
      module = await import(`./${route}.mjs`);
    }

    // 获取导出的处理函数（支持 export default 或 module.exports）
    const handlerFn = module.default || module;
    if (typeof handlerFn === 'function') {
      await handlerFn(req, res);
    } else {
      throw new Error(`Handler for ${route} is not a function`);
    }
  } catch (err) {
    // 如果模块加载失败或函数执行出错，返回 404
    console.error(`Failed to load handler for route: ${route}`, err);
    res.statusCode = 404;
    res.end(`Not Found: ${route}`);
  }
}
