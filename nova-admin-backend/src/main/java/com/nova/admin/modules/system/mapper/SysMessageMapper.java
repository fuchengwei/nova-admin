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

import java.time.LocalDateTime;
import java.util.List;

/** 站内消息 Mapper。 */
@Mapper
public interface SysMessageMapper extends BaseMapper<SysMessage> {

    List<SysMessage> selectDueScheduled(@Param("now") LocalDateTime now);

    @org.apache.ibatis.annotations.Update("""
            UPDATE sys_message
            SET status = 'SENDING'
            WHERE id = #{messageId}
              AND status = 'SCHEDULED'
              AND scheduled_at <= #{now}
            """)
    int claimScheduled(@Param("messageId") Long messageId, @Param("now") LocalDateTime now);

    @org.apache.ibatis.annotations.Update("""
            UPDATE sys_message
            SET status = #{status}, error_msg = #{errorMsg}
            WHERE id = #{messageId}
            """)
    int updateStatus(@Param("messageId") Long messageId, @Param("status") String status,
                     @Param("errorMsg") String errorMsg);

    @org.apache.ibatis.annotations.Update("""
            UPDATE sys_message
            SET status = 'CANCELED'
            WHERE id = #{messageId}
              AND status = 'SCHEDULED'
            """)
    int cancel(@Param("messageId") Long messageId);

    @Select("""
            SELECT *
            FROM sys_message
            WHERE id = #{messageId}
              AND deleted = 0
              AND status = 'DRAFT'
            """)
    SysMessage selectDraftById(@Param("messageId") Long messageId);

    @org.apache.ibatis.annotations.Update("""
            UPDATE sys_message
            SET title = #{title},
                content = #{content},
                link = #{link},
                publisher_id = #{publisherId},
                status = #{status},
                scheduled_at = #{scheduledAt},
                recipient_type = #{recipientType},
                recipient_ids = #{recipientIds},
                error_msg = NULL
            WHERE id = #{messageId}
              AND deleted = 0
              AND status = 'DRAFT'
            """)
    int updateDraft(@Param("messageId") Long messageId, @Param("title") String title,
                    @Param("content") String content, @Param("link") String link,
                    @Param("publisherId") Long publisherId, @Param("status") String status,
                    @Param("scheduledAt") LocalDateTime scheduledAt,
                    @Param("recipientType") String recipientType,
                    @Param("recipientIds") String recipientIds);

    @org.apache.ibatis.annotations.Update("""
            UPDATE sys_message
            SET deleted = 1
            WHERE id = #{messageId}
              AND deleted = 0
              AND status = 'DRAFT'
            """)
    int deleteDraft(@Param("messageId") Long messageId);

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
