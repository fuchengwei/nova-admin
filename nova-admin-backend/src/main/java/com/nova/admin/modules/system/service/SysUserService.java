package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import org.springframework.stereotype.Service;

@Service
public class SysUserService extends ServiceImpl<SysUserMapper, SysUser> {
}
