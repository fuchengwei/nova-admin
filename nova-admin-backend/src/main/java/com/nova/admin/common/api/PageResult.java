package com.nova.admin.common.api;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 分页结果
 */
@Data
public class PageResult<T> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private long total;
    private long current;
    private long size;
    private long pages;
    private List<T> records;

    public static <T> PageResult<T> empty() {
        return of(0L, 1L, 10L, Collections.emptyList());
    }

    public static <T> PageResult<T> of(long total, long current, long size, List<T> records) {
        PageResult<T> p = new PageResult<>();
        p.total = total;
        p.current = current;
        p.size = size;
        p.pages = size == 0 ? 0 : (total + size - 1) / size;
        p.records = records;
        return p;
    }

    public static <E, T> PageResult<T> of(IPage<E> page, List<T> records) {
        return of(page.getTotal(), page.getCurrent(), page.getSize(), records);
    }

    public static <T> PageResult<T> of(IPage<T> page) {
        return of(page.getTotal(), page.getCurrent(), page.getSize(), page.getRecords());
    }
}
