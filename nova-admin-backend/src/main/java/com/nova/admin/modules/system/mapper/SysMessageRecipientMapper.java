package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysMessageRecipient;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

/** 站内消息收件记录 Mapper。 */
@Mapper
public interface SysMessageRecipientMapper extends BaseMapper<SysMessageRecipient> {

    @Update("""
            UPDATE sys_message_recipient
            SET read_at = #{readAt}
            WHERE message_id = #{messageId}
              AND user_id = #{userId}
              AND read_at IS NULL
            """)
    int markRead(@Param("messageId") Long messageId,
                 @Param("userId") Long userId,
                 @Param("readAt") LocalDateTime readAt);

    @Update("""
            UPDATE sys_message_recipient
            SET read_at = #{readAt}
            WHERE user_id = #{userId}
              AND read_at IS NULL
            """)
    int markAllRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
}
