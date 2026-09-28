package com.oms.mainprompt.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.oms.mainprompt.entity.MainPromptEntity;
import com.oms.mainprompt.repository.MainPromptRepository;
import com.oms.mainprompt.service.MainPromptService;

@Service
public class MainPromptServiceImpl implements MainPromptService {

    @Autowired
    private MainPromptRepository repository;

    @Override
    public MainPromptEntity save(MainPromptEntity entity) {
        return repository.save(entity);
    }

    @Override
    public List<MainPromptEntity> getAll() {
        return repository.findAll();
    }

    @Override
    public MainPromptEntity getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public MainPromptEntity update(Long id, MainPromptEntity entity) {

        MainPromptEntity existing =
                repository.findById(id).orElse(null);

        if (existing != null) {

            existing.setPromptName(entity.getPromptName());
            existing.setPrompt(entity.getPrompt());

            return repository.save(existing);
        }

        return null;
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}