package com.mp3pipeline.controller;

import com.mp3pipeline.entity.Mp3Metadata;
import com.mp3pipeline.repository.Mp3MetadataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class Mp3UploadController {

    private static final Logger log = LoggerFactory.getLogger(Mp3UploadController.class);
    private static final String FRONTEND_DIR = "D:\\Ambinintsoa\\ITU\\Mr_Naina\\My_Spotify_S6\\frontend\\src\\mp3-uploaded";
    private static final String INBOX_DIR = "D:\\Ambinintsoa\\ITU\\Mr_Naina\\My_Spotify_S6\\backend\\mp3-inbox";

    // Injection du repository
    private final Mp3MetadataRepository metadataRepository;

    public Mp3UploadController(Mp3MetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
    }

    @GetMapping("/mp3s")
    public ResponseEntity<List<Mp3Metadata>> getAllMp3s() {
        log.info("[API-TARGET] Demande de récupération de tous les MP3 de la BDD");
        List<Mp3Metadata> list = metadataRepository.findAll();
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/mp3s/{id}")
    public ResponseEntity<Void> deleteMp3(@PathVariable Long id) {
        log.info("[API-TARGET] Demande de suppression du MP3 ID: {}", id);
        if (metadataRepository.existsById(id)) {
            metadataRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/mp3s/download/{id}")
    public ResponseEntity<Resource> downloadMp3(@PathVariable Long id) {
        log.info("[API] Demande de téléchargement binaire pour le MP3 ID: {}", id);

        Mp3Metadata metadata = metadataRepository.findById(id).orElse(null);
        if (metadata == null || metadata.getFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(metadata.getFilePath());

        // CORRECTION / SÉCURITÉ : On vérifie si le fichier existe ET que ce n'est pas
        // un dossier
        if (!file.exists() || !file.isFile()) {
            log.error("[API] Le chemin stocké n'est pas un fichier valide : {}", metadata.getFilePath());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .body(resource);
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
                    .fileSource(filePath)
                    .filePath(FRONTEND_DIR + File.separator
                            + (originalFilename != null ? originalFilename : "Fichier_anonyme.mp3"))
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

    @PostMapping("/uploadFront")
    public ResponseEntity<?> uploadFromFrontend(@RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body("Aucun fichier n'a été fourni.");
        }

        log.info("[API-FRONT] Début de l'importation de {} fichier(s) vers l'inbox", files.length);

        // S'assurer que le dossier de destination existe
        File inboxFolder = new File(INBOX_DIR);
        if (!inboxFolder.exists()) {
            inboxFolder.mkdirs();
        }

        List<String> uploadedFilesSummary = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "track_" + System.currentTimeMillis() + ".mp3";
            }

            try {
                // Définir l'emplacement cible exact dans backend/mp3-inbox
                Path targetLocation = Paths.get(INBOX_DIR).resolve(originalFilename);

                // Copie physique du fichier binaire vers le disque dur
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                log.info("[API-FRONT] Fichier copié avec succès dans l'inbox : {}", originalFilename);
                uploadedFilesSummary.add(originalFilename);

            } catch (IOException e) {
                log.error("[API-FRONT] Échec du stockage pour le fichier : {}", originalFilename, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors de l'écriture du fichier " + originalFilename + " : " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Succès : " + uploadedFilesSummary.size() + " fichier(s) placé(s) dans l'inbox.");
    }
}