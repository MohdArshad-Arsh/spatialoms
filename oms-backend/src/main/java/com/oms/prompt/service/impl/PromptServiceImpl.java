package com.oms.prompt.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.oms.prompt.entity.PromptEntity;
import com.oms.prompt.repository.PromptRepository;
import com.oms.prompt.service.PromptService;

@Service
public class PromptServiceImpl implements PromptService {

    @Autowired
    private PromptRepository promptRepository;

    @Override
    public PromptEntity save(PromptEntity prompt) {
        return promptRepository.save(prompt);
    }

    @Override
    public List<PromptEntity> getAll() {
        return promptRepository.findAll();
    }

    @Override
    public PromptEntity getById(Long id) {
        return promptRepository.findById(id).orElse(null);
    }

    @Override
    public PromptEntity update(Long id, PromptEntity prompt) {

        PromptEntity existing = promptRepository.findById(id).orElse(null);

        if(existing != null) {
            existing.setTableName(prompt.getTableName());
            existing.setSchemaPrompt(prompt.getSchemaPrompt());

            return promptRepository.save(existing);
        }

        return null;
    }

    @Override
    public void delete(Long id) {
        promptRepository.deleteById(id);
    }
}