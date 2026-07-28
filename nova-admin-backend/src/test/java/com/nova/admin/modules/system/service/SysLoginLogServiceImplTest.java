package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.nova.admin.modules.system.entity.SysLoginLog;
import com.nova.admin.modules.system.mapper.SysLoginLogMapper;
import com.nova.admin.modules.system.service.impl.SysLoginLogServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SysLoginLogServiceImplTest {

    @Mock
    private SysLoginLogMapper loginLogMapper;

    @InjectMocks
    private SysLoginLogServiceImpl loginLogService;

    @Test
    void purgeLoginLogs_deletesOnlyRecordsOlderThanRetentionPeriod() {
        loginLogService.purgeLoginLogs(30);

        ArgumentCaptor<Wrapper<SysLoginLog>> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(loginLogMapper).delete(wrapperCaptor.capture());

        assertThat(wrapperCaptor.getValue().getExpression().getNormal()).hasSize(3);
    }
}
