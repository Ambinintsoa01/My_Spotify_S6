package com.mp3pipeline.repository;

import com.mp3pipeline.entity.Mp3Metadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Mp3MetadataRepository extends JpaRepository<Mp3Metadata, Long> {
    // Hérite automatiquement de save(), findAll(), delete(), etc.
}