package com.nova.admin.modules.dashboard.service;

import com.nova.admin.modules.dashboard.dto.DashboardOverviewDTO;
import com.nova.admin.modules.dashboard.dto.DashboardRange;

public interface DashboardService {

    DashboardOverviewDTO getOverview(DashboardRange range);
}
