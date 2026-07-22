package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@Schema(description = "菜单树节点")
public class MenuTreeDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long parentId;
    private String name;
    private String type;
    private String perms;
    private String path;
    private String component;
    private String redirect;
    private String icon;
    private Integer sort;
    private Integer visible;
    private Integer status;
    private Integer keepAlive;
    private Integer alwaysShow;

    @Builder.Default
    private List<MenuTreeDTO> children = new ArrayList<>();
}
