package com.oms.mainprompt.service;

import java.util.List;

import com.oms.mainprompt.entity.MainPromptEntity;

public interface MainPromptService {

    MainPromptEntity save(MainPromptEntity entity);

    List<MainPromptEntity> getAll();

    MainPromptEntity getById(Long id);

    MainPromptEntity update(Long id, MainPromptEntity entity);

    void delete(Long id);
}