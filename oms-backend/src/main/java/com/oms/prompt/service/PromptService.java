package com.oms.prompt.service;

import java.util.List;

import com.oms.prompt.entity.PromptEntity;

public interface PromptService {

    PromptEntity save(PromptEntity prompt);

    List<PromptEntity> getAll();

    PromptEntity getById(Long id);

    PromptEntity update(Long id, PromptEntity prompt);

    void delete(Long id);

}