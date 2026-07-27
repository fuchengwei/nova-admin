package com.nova.admin.modules.dashboard.dto;

import com.nova.admin.common.exception.BizException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DashboardRangeTest {

    @Test
    void fromValue_whenSupportedRange_returnsMatchingRange() {
        assertThat(DashboardRange.fromValue("7d")).isEqualTo(DashboardRange.DAYS_7);
        assertThat(DashboardRange.fromValue("30d")).isEqualTo(DashboardRange.DAYS_30);
    }

    @Test
    void fromValue_whenUnsupportedRange_throwsBizException() {
        assertThatThrownBy(() -> DashboardRange.fromValue("90d"))
                .isInstanceOf(BizException.class);
    }
}
