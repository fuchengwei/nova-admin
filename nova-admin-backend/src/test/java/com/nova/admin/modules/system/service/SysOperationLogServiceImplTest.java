package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.nova.admin.modules.system.entity.SysOperationLog;
import com.nova.admin.modules.system.mapper.SysOperationLogMapper;
import com.nova.admin.modules.system.service.impl.SysOperationLogServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SysOperationLogServiceImplTest {

    @Mock
    private SysOperationLogMapper operationLogMapper;

    @InjectMocks
    private SysOperationLogServiceImpl operationLogService;

    @Test
    void purgeOperationLogs_deletesOnlyRecordsOlderThanRetentionPeriod() {
        operationLogService.purgeOperationLogs(30);

        ArgumentCaptor<Wrapper<SysOperationLog>> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(operationLogMapper).delete(wrapperCaptor.capture());

        assertThat(wrapperCaptor.getValue().getExpression().getNormal()).hasSize(3);
    }
}
