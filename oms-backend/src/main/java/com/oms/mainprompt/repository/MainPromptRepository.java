package com.oms.mainprompt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oms.mainprompt.entity.MainPromptEntity;

@Repository
public interface MainPromptRepository
        extends JpaRepository<MainPromptEntity, Long> {

}