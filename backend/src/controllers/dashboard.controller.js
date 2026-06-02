const dashboardService = require("../services/dashboard.service");

exports.getAdminDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getAdminDashboard();

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
