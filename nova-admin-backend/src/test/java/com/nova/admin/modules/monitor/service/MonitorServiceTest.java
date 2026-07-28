package com.nova.admin.modules.monitor.service;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.monitor.dto.CacheInfo;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.monitor.dto.OnlineUserPageQuery;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class MonitorServiceTest {

    @Test
    void getOnlineUserPage_whenFilteringByAccount_returnsMatchingPage() {
        MonitorService monitorService = new MonitorService(null, null);
        OnlineUserPageQuery query = new OnlineUserPageQuery();
        query.setAccount("ali");
        query.setCurrent(1);
        query.setSize(10);

        PageResult<OnlineUser> result = monitorService.pageOnlineUsers(List.of(
                onlineUser("alice", "Alice", "10.0.0.1", "2026-07-27 10:00:00"),
                onlineUser("bob", "Bob", "10.0.0.2", "2026-07-27 09:00:00")), query);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getRecords()).extracting(OnlineUser::getAccount).containsExactly("alice");
    }

    @Test
    void parseCommandStats_whenInfoContainsCommandStats_returnsSortedStats() {
        MonitorService monitorService = new MonitorService(null, null);
        Properties props = new Properties();
        props.setProperty("cmdstat_get", "calls=12,usec=20");
        props.setProperty("cmdstat_auth", "calls=3,usec=8");
        props.setProperty("redis_version", "8.0.0");

        assertThat(monitorService.parseCommandStats(props))
                .extracting(CacheInfo.CommandStat::getName)
                .containsExactly("auth", "get");
    }

    private OnlineUser onlineUser(String account, String nickname, String loginIp, String loginTime) {
        OnlineUser user = new OnlineUser();
        user.setAccount(account);
        user.setNickname(nickname);
        user.setLoginIp(loginIp);
        user.setLoginTime(loginTime);
        return user;
    }
}
