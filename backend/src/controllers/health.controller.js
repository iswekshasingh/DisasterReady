/**
 * Health check controller
 * GET /api/health
 */
export const getHealthStatus = (req, res) => {
  const healthData = {
    status: 'healthy',
    service: 'DisasterReady Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthData);
};

