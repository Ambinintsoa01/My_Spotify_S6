package com.mp3pipeline.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class Mp3UploadController {

    private static final Logger log = LoggerFactory.getLogger(Mp3UploadController.class);

    @PostMapping("/upload")
    public ResponseEntity<String> handleMp3Upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("filePath") String filePath,
            @RequestParam Map<String, String> allParams) {

        log.info("[API-TARGET] Fichier MP3 bien reçu via HTTP POST : {}", file.getOriginalFilename());
        log.info("[API-TARGET] Titre extrait : {}", allParams.getOrDefault("tag_title", "Inconnu"));
        log.info("[API-TARGET] Artiste extrait : {}", allParams.getOrDefault("tag_artist", "Inconnu"));

        // C'est ici que tu peux ajouter ta logique métier (ex: sauvegarder en BDD, stocker le fichier...)
        

        return ResponseEntity.ok("Fichier et métadonnées stockés avec succès.");
    }
}