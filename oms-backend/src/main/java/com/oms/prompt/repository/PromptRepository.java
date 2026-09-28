package com.oms.prompt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oms.prompt.entity.PromptEntity;

@Repository
public interface PromptRepository extends JpaRepository<PromptEntity, Long> {

}