export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server.ts');
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel API Entry Error:', err);
    res.status(500).json({
      error: 'Vercel API Entry Error',
      message: err.message || String(err),
      stack: err.stack,
    });
  }
}
