package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 部门树节点
 */
@Data
@Builder
@Schema(description = "部门树节点")
public class DeptTreeDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long parentId;
    private String name;
    private String code;
    private String leader;
    private String phone;
    private String email;
    private Integer sort;
    private Integer status;
    private LocalDateTime createTime;

    @Builder.Default
    private List<DeptTreeDTO> children = new ArrayList<>();
}
