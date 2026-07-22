package com.nova.admin.modules.infra.dto;

import com.nova.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

@Data
@EqualsAndHashCode(callSuper = true)
public class FilePageQuery extends PageQuery {

    @Serial
    private static final long serialVersionUID = 1L;

    private String name;
    private String contentType;
}
