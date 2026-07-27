package com.nova.admin.modules.dashboard.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.modules.dashboard.dto.DashboardOverviewDTO;
import com.nova.admin.modules.dashboard.dto.DashboardRange;
import com.nova.admin.modules.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "首页仪表盘")
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "获取首页仪表盘概览")
    @GetMapping("/overview")
    public R<DashboardOverviewDTO> getOverview(
            @Parameter(in = ParameterIn.QUERY, description = "趋势统计范围", schema = @Schema(allowableValues = {"7d", "30d"}))
            @RequestParam(defaultValue = "7d") String range) {
        return R.ok(dashboardService.getOverview(DashboardRange.fromValue(range)));
    }
}
