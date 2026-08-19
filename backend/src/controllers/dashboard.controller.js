const dashboardService = require("../services/dashboard.service");

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getAdminDashboard();

    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};
