package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.nova.admin.modules.system.dto.NotificationPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecordDTO;
import com.nova.admin.modules.system.dto.NotificationRecordSummaryDTO;
import com.nova.admin.modules.system.entity.SysMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/** 站内消息 Mapper。 */
@Mapper
public interface SysMessageMapper extends BaseMapper<SysMessage> {

    IPage<NotificationRecordSummaryDTO> selectRecordPage(
            IPage<NotificationRecordSummaryDTO> page, @Param("query") NotificationPageQuery query);

    NotificationRecordSummaryDTO selectRecordById(@Param("messageId") Long messageId);

    @Select("""
            SELECT COUNT(1)
            FROM sys_message_recipient r
            INNER JOIN sys_message m ON m.id = r.message_id AND m.deleted = 0
            WHERE r.user_id = #{userId}
              AND r.read_at IS NULL
            """)
    long countUnreadByUserId(@Param("userId") Long userId);

    @Select("""
            SELECT r.message_id AS id,
                   m.type,
                   m.title,
                   m.content,
                   m.link,
                   CASE WHEN r.read_at IS NULL THEN FALSE ELSE TRUE END AS read,
                   r.create_time AS created_at
            FROM sys_message_recipient r
            INNER JOIN sys_message m ON m.id = r.message_id AND m.deleted = 0
            WHERE r.user_id = #{userId}
            ORDER BY r.create_time DESC, r.id DESC
            LIMIT #{limit}
            """)
    List<NotificationRecordDTO> selectRecentByUserId(
            @Param("userId") Long userId, @Param("limit") int limit);
}
