package com.mp3pipeline.controller;

import com.mp3pipeline.entity.Mp3Metadata;
import com.mp3pipeline.repository.Mp3MetadataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class Mp3UploadController {

    private static final Logger log = LoggerFactory.getLogger(Mp3UploadController.class);

    // Injection du repository
    private final Mp3MetadataRepository metadataRepository;

    public Mp3UploadController(Mp3MetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> handleMp3Upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("filePath") String filePath,
            @RequestParam Map<String, String> allParams) {

        String originalFilename = file.getOriginalFilename();

        log.info("[API-TARGET] Fichier MP3 bien reçu via HTTP POST : {}", originalFilename);

        String title = allParams.getOrDefault("tag_title", "Inconnu");
        String artist = allParams.getOrDefault("tag_artist", "Inconnu");
        String album = allParams.getOrDefault("tag_album", "Inconnu");
        String year = allParams.getOrDefault("tag_year", "Inconnu");
        String durationStr = allParams.getOrDefault("audio_duration_secs", "0");
        String genre = allParams.getOrDefault("tag_genre", "Inconnu");

        log.info("[API-TARGET] Titre extrait : {}", title);
        log.info("[API-TARGET] Artiste extrait : {}", artist);
        log.info("[API-TARGET] Album extrait : {}", album);
        log.info("[API-TARGET] Année extrait : {}", year);
        log.info("[API-TARGET] Durée extrait : {} secondes", durationStr);
        log.info("[API-TARGET] Genre extrait : {}", genre);

        try {
            // Conversion de la durée en Integer de manière sécurisée
            int duration = 0;
            try {
                // Au cas où la durée contiendrait des décimales (ex: "180.5")
                duration = (int) Double.parseDouble(durationStr);
            } catch (NumberFormatException e) {
                log.warn("[API-TARGET] Impossible de parser la durée '{}', mise à 0 par défaut.", durationStr);
            }

            // Construction de l'objet à enregistrer en BDD
            Mp3Metadata metadata = Mp3Metadata.builder()
                    .fileName(originalFilename != null ? originalFilename : "Fichier_anonyme.mp3")
                    .filePath(filePath)
                    .title(title)
                    .artist(artist)
                    .album(album)
                    .year(year)
                    .durationSeconds(duration)
                    .genre(genre)
                    .build();

            // Sauvegarde effective dans MySQL
            Mp3Metadata savedMetadata = metadataRepository.save(metadata);
            log.info("[API-TARGET] Métadonnées enregistrées avec succès en BDD (ID: {})", savedMetadata.getId());

            // TODO: Logique optionnelle pour sauvegarder physiquement le fichier binaire
            // (file.getBytes()) si nécessaire

            return ResponseEntity.ok("Fichier reçu et métadonnées stockées en BDD avec succès.");

        } catch (Exception e) {
            log.error("[API-TARGET] Erreur lors de l'enregistrement des métadonnées", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne lors de la sauvegarde des métadonnées : " + e.getMessage());
        }
    }
}