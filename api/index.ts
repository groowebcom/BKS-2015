export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server.ts');
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Runtime Handler Error]:', err);
    res.status(500).json({
      error: 'Vercel Serverless Function Crash',
      message: err?.message || String(err),
      stack: err?.stack,
      suggestion: 'This is a runtime error during import. It might be due to missing modules, path issues, or top-level initialization crashes.'
    });
  }
}

